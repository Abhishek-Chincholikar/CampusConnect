const express = require('express');
const mongoose = require('mongoose');
const JoinRequest = require('../models/JoinRequest');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const REVIEW_STATUSES = ['Pending', 'Tech_Round', 'Interview', 'Voting', 'Rejected'];

const populateApplication = (query) =>
  query
    .populate('user', 'full_name Roll_Number role joined_clubs joined_committee')
    .populate('organization', 'name type max_capacity faculty_coordinator');

// Helper: Check review permissions dynamically for Admins, Faculty, Heads, and Student POCs
const checkReviewAccess = async (user, organizationId = null) => {
  if (['Admin', 'Head'].includes(user.role)) return true;

  if (user.role === 'Faculty') {
    if (!organizationId) return true;
    const org = await Organization.findById(organizationId).lean();
    if (!org) return false;
    return String(org.faculty_coordinator || '').toLowerCase().trim() === String(user.email || '').toLowerCase().trim();
  }

  const isModerator = user.organizationMemberships?.some((m) => m.canModerate === true);
  if (!isModerator) return false;

  if (organizationId) {
    const allowedOrgIds = user.organizationMemberships
      .filter((m) => m.canModerate)
      .map((m) => String(m.organization._id || m.organization));
    return allowedOrgIds.includes(String(organizationId));
  }

  return true;
};

router.get('/', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const { status, organizationId } = req.query;

    const hasGlobalAccess = await checkReviewAccess(user);
    if (!hasGlobalAccess) {
      return res.status(403).json({ message: 'You are not allowed to perform this action' });
    }

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (organizationId) {
      if (!isValidObjectId(organizationId)) {
        return res.status(400).json({ message: 'Invalid organization id' });
      }
      const hasOrgAccess = await checkReviewAccess(user, organizationId);
      if (!hasOrgAccess) {
        return res.status(403).json({ message: 'Forbidden: You cannot moderate this organization' });
      }
      filter.organization = organizationId;
    } else if (user.role === 'Faculty') {
      const facultyOrgs = await Organization.find({
        faculty_coordinator: { $regex: new RegExp(`^${user.email}$`, 'i') }
      }).lean();
      const allowedOrgIds = facultyOrgs.map((o) => o._id);
      filter.organization = { $in: allowedOrgIds };
    } else if (user.role === 'Student') {
      const allowedOrgIds = (user.organizationMemberships || [])
        .filter((m) => m.canModerate)
        .map((m) => m.organization._id || m.organization);
      filter.organization = { $in: allowedOrgIds };
    }

    const applications = await populateApplication(
      JoinRequest.find(filter).sort({ updatedAt: -1 })
    ).lean();

    return res.json({ data: applications });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const applications = await JoinRequest.find({ user: req.user._id })
      .populate('organization', 'name type max_capacity faculty_coordinator')
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ data: applications });
  } catch (error) {
    return next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { organizationId, remarks = '' } = req.body;
    const user = req.user;

    const canApply = ['Student', 'Head'].includes(user.role);
    if (!canApply) {
      return res.status(403).json({ message: 'Faculty accounts review applications and cannot submit student applications.' });
    }

    if (!organizationId || !isValidObjectId(organizationId)) {
      return res.status(400).json({ message: 'A valid organizationId is required' });
    }

    const organization = await Organization.findById(organizationId).lean();

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const existingRequest = await JoinRequest.findOne({
      user: req.user._id,
      organization: organization._id,
    });

    if (existingRequest) {
      return res.status(409).json({
        message: 'You have already applied to this organization',
        data: existingRequest,
      });
    }

    const application = await JoinRequest.create({
      user: req.user._id,
      organization: organization._id,
      remarks,
    });

    return res.status(201).json({
      message: 'Application submitted for the selection process',
      data: application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this organization' });
    }

    return next(error);
  }
});

router.put('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await JoinRequest.findById(id);

    if (!application) {
      return res.status(404).json({ message: 'Application request not found' });
    }

    const hasAccess = await checkReviewAccess(req.user, application.organization);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Forbidden: You cannot modify applications for this organization' });
    }

    if (status === 'Approved') {
      return res.status(400).json({
        message: 'Use the approval endpoint so capacity and committee rules are enforced',
      });
    }

    if (!REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid application status' });
    }

    if (application.status === 'Approved') {
      return res.status(400).json({ message: 'Approved applications cannot be moved backward' });
    }

    application.status = status;

    if (typeof remarks === 'string') {
      application.remarks = remarks.trim();
    }

    await application.save();

    const updatedApplication = await populateApplication(
      JoinRequest.findById(application._id)
    ).lean();

    return res.json({
      message: 'Application status updated',
      data: updatedApplication,
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id/approve', authenticate, async (req, res, next) => {
  const { id } = req.params;
  const { remarks } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid application id' });
  }

  const session = await mongoose.startSession();

  try {
    let approvedRequest;

    await session.withTransaction(async () => {
      const joinRequest = await JoinRequest.findById(id).session(session);

      if (!joinRequest) {
        const error = new Error('Application request not found');
        error.statusCode = 404;
        throw error;
      }

      const hasAccess = await checkReviewAccess(req.user, joinRequest.organization);
      if (!hasAccess) {
        const error = new Error('Forbidden: You cannot approve applications for this organization');
        error.statusCode = 403;
        throw error;
      }

      if (joinRequest.status === 'Rejected') {
        const error = new Error('Rejected applications cannot be approved');
        error.statusCode = 400;
        throw error;
      }

      const organization = await Organization.findById(joinRequest.organization).session(session);
      const applicant = await User.findById(joinRequest.user).session(session);

      if (!organization) {
        const error = new Error('Associated organization not found');
        error.statusCode = 404;
        throw error;
      }

      if (!applicant) {
        const error = new Error('Associated user not found');
        error.statusCode = 404;
        throw error;
      }

      if (organization.type === 'Committee') {
        if (applicant.joined_committee) {
          const error = new Error('User is already bound to a committee');
          error.statusCode = 400;
          throw error;
        }

        applicant.joined_committee = organization._id;
      }

      if (organization.type === 'Club') {
        const acceptedMembers = await User.countDocuments({
          joined_clubs: organization._id,
        }).session(session);

        if (acceptedMembers >= organization.max_capacity) {
          const error = new Error('Club capacity reached');
          error.statusCode = 400;
          throw error;
        }

        const alreadyJoined = applicant.joined_clubs.some((clubId) =>
          clubId.equals(organization._id)
        );

        if (!alreadyJoined) {
          applicant.joined_clubs.push(organization._id);
        }
      }

      joinRequest.status = 'Approved';

      if (typeof remarks === 'string') {
        joinRequest.remarks = remarks.trim();
      }

      await applicant.save({ session });
      await joinRequest.save({ session });

      approvedRequest = await populateApplication(
        JoinRequest.findById(joinRequest._id)
      )
        .session(session)
        .lean();
    });

    return res.json({
      message: 'Application approved successfully',
      data: approvedRequest,
    });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await JoinRequest.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application request not found' });
    }

    const hasAccess = await checkReviewAccess(req.user, application.organization);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Forbidden: You cannot delete applications for this organization' });
    }

    const deletedSnapshot = application.toObject();
    await JoinRequest.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Application successfully deleted.',
      data: deletedSnapshot
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;