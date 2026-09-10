const express = require('express');
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const User = require('../models/User');

const authMiddleware = require('../middleware/auth');
const authenticate = authMiddleware.authenticate || authMiddleware.protect || ((req, res, next) => next());
const authorizeRoles = authMiddleware.authorizeRoles || authMiddleware.restrictTo || (() => (req, res, next) => next());

const router = express.Router();

// Helper: Silently auto-provision a faculty user account so they can log in immediately with 12345678
async function ensureFacultyAccountExists(email) {
  if (!email || email === 'Not Assigned') return;
  const cleanEmail = String(email).toLowerCase().trim();
  
  let facultyUser = await User.findOne({ email: cleanEmail });
  if (!facultyUser) {
    // Generate a clean display name from email prefix (e.g., pankajs -> Pankaj S.)
    const namePrefix = cleanEmail.split('@')[0];
    const formattedName = namePrefix
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    facultyUser = new User({
      Roll_Number: `FAC_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      full_name: formattedName.length > 2 ? formattedName : 'Faculty Coordinator',
      email: cleanEmail,
      role: 'Faculty',
      isVerified: true,
      isFirstLogin: false
    });
    
    // Set default password to 12345678 silently without sending any email
    facultyUser.setPassword('12345678');
    await facultyUser.save();
  }
}

// 1. GET: Fetch all organizations normally
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

// 2. GET BY ID: Fetch an individual organization profile
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

// 3. POST: Provision organization and auto-create silent faculty login
router.post('/create', authenticate, authorizeRoles('Admin'), async (req, res, next) => {
  try {
    const { name, type, description, student_head, faculty_coordinator, max_capacity } = req.body;

    if (!name || !type || !description) {
      return res.status(400).json({ message: 'Name, Type classification, and Operational Description are required' });
    }

    const normalizedName = String(name).trim();
    const existingOrg = await Organization.findOne({ name: { $regex: `^${normalizedName}$`, $options: 'i' } });
    
    if (existingOrg) {
      return res.status(409).json({ message: 'An organization with this precise name already exists' });
    }

    const facultyEmail = faculty_coordinator ? String(faculty_coordinator).trim() : 'Not Assigned';

    const newOrgData = {
      name: normalizedName,
      type,
      description,
      faculty_coordinator: facultyEmail,
      max_capacity: max_capacity ? Number(max_capacity) : 50
    };

    if (student_head && mongoose.Types.ObjectId.isValid(student_head)) {
      newOrgData.student_head = student_head;
    }

    const organization = await Organization.create(newOrgData);

    // Silently provision faculty login credentials in background (ZERO emails sent)
    if (facultyEmail !== 'Not Assigned') {
      await ensureFacultyAccountExists(facultyEmail);
    }

    return res.status(201).json({ message: 'Organization provisioned and faculty access synchronized successfully', data: organization });
  } catch (error) {
    return next(error);
  }
});

// 4. DELETE: Complete physical erasure with cascade cleanup behaviors
router.delete('/:id', authenticate, authorizeRoles('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid target organization tracking key' });
    }

    const organization = await Organization.findByIdAndDelete(id);
    if (!organization) {
      return res.status(404).json({ message: 'Target organization not found in database records' });
    }

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