const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required for authentication');
  }

  return jwt.sign(
    {
      role: user.role,
      Roll_Number: user.Roll_Number,
    },
    process.env.JWT_SECRET,
    {
      subject: user._id.toString(),
      issuer: process.env.JWT_ISSUER || 'campusconnect',
      expiresIn: '7d',
    }
  );
};

const normalizeRollNumber = (rollNumber) => String(rollNumber || '').trim().toUpperCase();

const sanitizeProfile = (user) => {
  if (typeof user.toSafeProfile === 'function') {
    return user.toSafeProfile();
  }

  return {
    id: user._id,
    Roll_Number: user.Roll_Number,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    joined_clubs: user.joined_clubs,
    joined_committee: user.joined_committee,
  };
};

router.post('/register', async (req, res, next) => {
  try {
    const { Roll_Number, full_name, email, password } = req.body;

    const normalizedRollNumber =
      normalizeRollNumber(Roll_Number);

    if (
      !email ||
      !email
        .toLowerCase()
        .endsWith('@siescoms.sies.edu.in')
    ) {
      return res.status(400).json({
        message:
          'Only SIESCOMS email addresses are allowed',
      });
    }

    if (
      !normalizedRollNumber ||
      !full_name ||
      !password
    ) {
      return res.status(400).json({
        message:
          'Roll number, full name and password are required',
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters',
      });
    }

    const existingUser =
      await User.findOne({
        Roll_Number: normalizedRollNumber,
      }).lean();

    if (existingUser) {
      return res.status(409).json({
        message:
          'A user with this roll number already exists',
      });
    }

    const user = new User({
      Roll_Number: normalizedRollNumber,
      full_name,
      email,
      role: 'Student',
    });

    user.setPassword(password);

    await user.save();

    const token = createToken(user);

    return res.status(201).json({
      message: 'CampusConnect account created',
      data: {
        token,
        user: sanitizeProfile(user),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { Roll_Number, password } = req.body;
    const normalizedRollNumber = normalizeRollNumber(Roll_Number);

    if (!normalizedRollNumber || !password) {
      return res.status(400).json({ message: 'Roll number and password are required' });
    }

    const user = await User.findOne({ Roll_Number: normalizedRollNumber }).select(
      '+password_hash +password_salt'
    );

    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({ message: 'Invalid roll number or password' });
    }

    const token = createToken(user);

    return res.json({
      message: 'Login successful',
      data: {
        token,
        user: sanitizeProfile(user),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', authenticate, async (req, res) => {
  return res.json({
    data: {
      user: sanitizeProfile(req.user),
    },
  });
});

module.exports = router;
