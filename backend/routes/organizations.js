const express = require('express');
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const User = require('../models/User');

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

module.exports = router;
