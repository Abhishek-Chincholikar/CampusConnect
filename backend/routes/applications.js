const express = require('express');
const mongoose = require('mongoose');
const JoinRequest = require('../models/JoinRequest');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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

router.post('/', authenticate, authorizeRoles('Student', 'Head'), async (req, res, next) => {
  try {
    const { organizationId, remarks = '' } = req.body;

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

router.put(
  '/:id/approve',
  authenticate,
  authorizeRoles('Head', 'Faculty'),
  async (req, res, next) => {
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

        approvedRequest = await JoinRequest.findById(joinRequest._id)
          .populate('user', 'full_name Roll_Number role joined_clubs joined_committee')
          .populate('organization', 'name type max_capacity faculty_coordinator')
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
  }
);

module.exports = router;
