const express = require('express');
const crypto = require('crypto');
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
    if (!/^(MCA|MMS)\d{5}$/i.test(normalizedRollNumber)) {
      return res.status(400).json({
        message:
          'Roll number must be in format MCA25015 or MMS25015'
      });
    }
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
// ==========================================
// EMERGENCY PATCH: LIVE DEMO ACC_RECOVERY ENDPOINTS
// ==========================================

// 1. Initiate Recovery (Generates clean Token back to client layout)
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Institutional email is required' });
    }

    // CRITICAL VALIDATION FIX: Explicitly include all required model properties in the memory select scope
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      'Roll_Number full_name email role +password_hash +password_salt'
    );
    
    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email address' });
    }

    // Generate random safe demo token hex
    const token = crypto.randomBytes(20).toString('hex');
    
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Explicit 1 Hour Window
    
    // Disables external paths validation strictly for the token generation save step
    await user.save({ validateBeforeSave: false });

    // DEMO INLINE OPTIMIZATION: Returns token directly so you can display/copy it in front of the coordinator!
    return res.json({
      message: 'Demo Recovery Engine: Token generated successfully',
      token: token
    });
  } catch (error) {
    return next(error);
  }
});

// 2. Commit Target Recovery Password Modification
router.post('/reset-password/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    // CRITICAL VALIDATION FIX: Explicitly include all required model properties here as well
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('Roll_Number full_name email role +password_hash +password_salt');

    if (!user) {
      return res.status(400).json({ message: 'Recovery token is invalid or has expired' });
    }

    // Replicating model encryption to preserve password verification checks
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');

    user.password_salt = salt;
    user.password_hash = hash;
    
    // Clear token context from record
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save({ validateBeforeSave: false });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
