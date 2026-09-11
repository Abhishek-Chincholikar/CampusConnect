const express = require('express');
const mongoose = require('mongoose');
const JoinRequest = require('../models/JoinRequest');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const REVIEW_STATUSES = ['Pending', 'Tech_Round', 'Interview', 'Voting', 'Rejected'];
const OBJECT_ID_HEX = /^[a-fA-F0-9]{24}$/;

const resolveOrgId = (value) => {
  if (!value) return null;
  const raw = value._id || value;
  const id = String(raw);
  return OBJECT_ID_HEX.test(id) ? id : null;
};

const uniqueOrgIds = (values) => [...new Set(values.map(resolveOrgId).filter(Boolean))];

const populateApplication = (query) =>
  query
    .populate('user', 'full_name Roll_Number role email joined_clubs joined_committee')
    .populate('organization', 'name type max_capacity faculty_coordinator');

// Helper: Check review permissions securely against the LIVE database (bypassing stale JWTs)
const checkReviewAccess = async (userId, organizationId = null) => {
  const freshUser = await User.findById(userId).lean();
  if (!freshUser) return false;

  if (['Admin', 'Head'].includes(freshUser.role)) return true;

  if (freshUser.role === 'Faculty') {
    if (!organizationId) return true;
    const org = await Organization.findById(organizationId).lean();
    if (!org) return false;

    const coord = String(org.faculty_coordinator || '').toLowerCase().trim();
    const email = String(freshUser.email || '').toLowerCase().trim();
    const name = String(freshUser.full_name || '').toLowerCase().trim();
    return coord.includes(email) || coord.includes(name) || name.includes(coord) || email.includes(coord);
  }

  const isModerator = (freshUser.organizationMemberships || []).some((m) => m.canModerate === true);
  const isHead = await Organization.exists({ student_head: freshUser._id });

  if (!isModerator && !isHead) return false;

  if (organizationId) {
    const allowedOrgIds = uniqueOrgIds(
      (freshUser.organizationMemberships || [])
        .filter((m) => m.canModerate)
        .map((m) => m.organization?._id || m.organization)
    );

    const headMatch = await Organization.exists({ _id: organizationId, student_head: freshUser._id });
    return allowedOrgIds.includes(resolveOrgId(organizationId)) || Boolean(headMatch);
  }

  return true;
};

router.get('/', authenticate, async (req, res, next) => {
  try {
    console.log('\n==================== [GET /applications] ====================');
    console.log('1. Requester from Token:', req.user?.full_name, `(${req.user?._id})`);

    const hasGlobalAccess = await checkReviewAccess(req.user._id);
    console.log('2. Has Global Review Access:', hasGlobalAccess);

    if (!hasGlobalAccess) {
      console.log('❌ Access Denied: checkReviewAccess returned false.');
      return res.status(403).json({ message: 'You are not allowed to perform this action' });
    }

    const freshUser = await User.findById(req.user._id).lean();
    const { status, organizationId } = req.query;

    const filter = {};
    if (status) filter.status = status;

    if (organizationId) {
      if (!isValidObjectId(organizationId)) {
        return res.status(400).json({ message: 'Invalid organization id' });
      }
      const hasOrgAccess = await checkReviewAccess(freshUser._id, organizationId);
      if (!hasOrgAccess) {
        console.log(`❌ Forbidden: User cannot moderate organizationId: ${organizationId}`);
        return res.status(403).json({ message: 'Forbidden: You cannot moderate this organization' });
      }
      filter.organization = organizationId;
    } else if (freshUser.role === 'Faculty') {
      const facultyOrgs = await Organization.find({
        $or: [
          { faculty_coordinator: { $regex: new RegExp(freshUser.email || '', 'i') } },
          { faculty_coordinator: { $regex: new RegExp(freshUser.full_name || '', 'i') } }
        ]
      }).lean();
      filter.organization = { $in: facultyOrgs.map((o) => o._id) };
      console.log('Faculty Allowed Org IDs:', facultyOrgs.map((o) => o._id.toString()));
    } else if (freshUser.role === 'Student') {
      console.log('3. Student DB Memberships:', JSON.stringify(freshUser.organizationMemberships, null, 2));

      // 1. Explicit ID matches
      const membershipOrgIds = (freshUser.organizationMemberships || [])
        .filter((m) => m.canModerate)
        .map((m) => String(m.organization?._id || m.organization))
        .filter(Boolean);

      // 2. Head role matches
      const headedOrgs = await Organization.find({ student_head: freshUser._id }, '_id').lean();
      const headedOrgIds = headedOrgs.map((org) => String(org._id));

      // 3. Dynamic Title Match: If membership title mentions 'CSR', find the CSR organization directly
      const titleMatches = [];
      const userTitles = (freshUser.organizationMemberships || [])
        .filter((m) => m.canModerate)
        .map((m) => String(m.title || ''));

      for (const t of userTitles) {
        if (/CSR/i.test(t) || /MCA POC/i.test(t)) {
          // Find the active CSR organization regardless of its new ID
          const csrOrg = await Organization.findOne({ name: /CSR/i }, '_id').lean();
          if (csrOrg) {
            console.log(`🔎 Dynamic Title Match: Linked user to active CSR Committee ID -> ${csrOrg._id}`);
            titleMatches.push(String(csrOrg._id));
          }
        }
      }

      const rawCombined = [...new Set([...membershipOrgIds, ...headedOrgIds, ...titleMatches])];
      console.log('4. Combined Moderate Org IDs (Including Dynamic Matches):', rawCombined);

      if (rawCombined.length === 0) {
        console.log('⚠️ No moderate permissions found. Returning empty array.');
        return res.json({ data: [] });
      }

      const objectIdList = rawCombined
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      filter.organization = { $in: [...objectIdList, ...rawCombined] };
    }

    console.log('5. Final DB Query Filter:', JSON.stringify(filter));

    // Global diagnostic block (moved to safe scope)
    const allApps = await JoinRequest.find({}).lean();
    console.log("=== ALL EXISTING APPLICATIONS IN DB ===");
    allApps.forEach(a => {
      console.log(`App ID: ${a._id} | User: ${a.user} | Org in App: ${a.organization}`);
    });
    console.log("========================================");

    const applications = await populateApplication(
      JoinRequest.find(filter).sort({ updatedAt: -1 })
    ).lean();

    console.log(`6. Result: Found ${applications.length} applications matching filter.`);
    console.log('=============================================================\n');

    return res.json({ data: applications });
  } catch (error) {
    console.error('🔥 Error in GET /applications:', error);
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

    const hasAccess = await checkReviewAccess(req.user._id, application.organization);
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

      const hasAccess = await checkReviewAccess(req.user._id, joinRequest.organization);
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

    const hasAccess = await checkReviewAccess(req.user._id, application.organization);
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