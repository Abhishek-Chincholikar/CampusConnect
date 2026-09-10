const express = require('express');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Middleware: Strictly block non-admins
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden: Admin clearance required.' });
  }
  next();
};

// ==========================================
// ASSIGN STUDENT LEADERSHIP / POC ROLE
// ==========================================
router.post('/assign-leadership', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { studentEmail, organizationId, customTitle, grantModeration } = req.body;

    const organization = await Organization.findById(organizationId);
    if (!organization) return res.status(404).json({ message: 'Committee/Club not found.' });

    const student = await User.findOne({ email: studentEmail.toLowerCase().trim() });
    if (!student) return res.status(404).json({ message: 'Student account not found.' });

    // Check if student is already in this organization's matrix
    const existingIndex = student.organizationMemberships.findIndex(
      (m) => m.organization.toString() === organizationId
    );

    if (existingIndex >= 0) {
      student.organizationMemberships[existingIndex].title = customTitle;
      student.organizationMemberships[existingIndex].canModerate = grantModeration;
    } else {
      student.organizationMemberships.push({
        organization: organizationId,
        title: customTitle,
        canModerate: grantModeration
      });
    }

    await student.save();

    return res.status(200).json({
      message: `Successfully appointed ${student.full_name} as ${customTitle} for ${organization.name}.`,
      data: student.organizationMemberships
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;