const express = require('express');
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const organizations = await Organization.find()
      .populate('student_head', 'full_name Roll_Number role')
      .sort({ type: 1, name: 1 })
      .lean();

    const organizationsWithCounts = await Promise.all(
      organizations.map(async (organization) => {
        const acceptedMembers = await User.countDocuments(
          organization.type === 'Committee'
            ? { joined_committee: organization._id }
            : { joined_clubs: organization._id }
        );

        return {
          ...organization,
          accepted_members: acceptedMembers,
        };
      })
    );

    res.json({ data: organizationsWithCounts });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid organization id' });
    }

    const organization = await Organization.findById(req.params.id)
      .populate('student_head', 'full_name Roll_Number role')
      .lean();

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const acceptedMembers = await User.countDocuments(
      organization.type === 'Committee'
        ? { joined_committee: organization._id }
        : { joined_clubs: organization._id }
    );

    return res.json({
      data: {
        ...organization,
        accepted_members: acceptedMembers,
      },
    });
  } catch (error) {
    return next(error);
  }
});
// ==========================================
// INSTITUTIONAL PROVISIONING ARCHITECTURE 
// ==========================================

// 1. Post Route: Authorize Admin and Faculty Coordinator to provision structural clubs
router.post('/create', authenticate, authorizeRoles('Admin', 'Faculty'), async (req, res, next) => {
  try {
    const { name, type, description, student_head } = req.body;

    if (!name || !type || !description) {
      return res.status(400).json({ message: 'Name, Type classification, and Operational Description are required' });
    }

    const normalizedName = String(name).trim();
    const existingOrg = await Organization.findOne({ name: { $regex: `^${normalizedName}$`, $options: 'i' } });
    
    if (existingOrg) {
      return res.status(409).json({ message: 'An organization with this precise name already exists' });
    }

    const newOrgData = {
      name: normalizedName,
      type,
      description,
    };

    // If an optional student head id is sent during creation, bind it if valid
    if (student_head && mongoose.Types.ObjectId.isValid(student_head)) {
      newOrgData.student_head = student_head;
    }

    const organization = await Organization.create(newOrgData);
    return res.status(201).json({ message: 'Organization provisioned successfully', data: organization });
  } catch (error) {
    return next(error);
  }
});

// 2. Delete Route: Handle complete cascading deletion parameters of selected organizations
router.delete('/:id', authenticate, authorizeRoles('Admin', 'Faculty'), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid target organization tracking key' });
    }

    const organization = await Organization.findByIdAndDelete(id);
    if (!organization) {
      return res.status(404).json({ message: 'Target organization not found in system registers' });
    }

    // Cascade Cleanup Actions: Unbind references instantly inside standard user registers
    if (organization.type === 'Committee') {
      await User.updateMany({ joined_committee: id }, { $set: { joined_committee: null } });
    } else {
      await User.updateMany({ joined_clubs: id }, { $pull: { joined_clubs: id } });
    }

    return res.json({ message: 'Organization disbanded and user associations purged successfully' });
  } catch (error) {
    return next(error);
  }
});
module.exports = router;
