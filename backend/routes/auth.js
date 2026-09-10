const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const TempUser = require('../models/TempUser'); 

const router = express.Router();

// ==========================================
// PRODUCTION BREVO SMTP TRANSPORTER (FREE TIER)
// ==========================================
console.log("SMTP Login ID:", process.env.BREVO_SMTP_LOGIN);
console.log("SMTP Key exists?:", !!process.env.BREVO_SMTP_KEY);

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 2525, // <-- The alternative SMTP port that bypasses cloud blocks
  secure: false, // <-- Must be false when using 2525 (it uses STARTTLS instead)
  pool: true,
  maxConnections: 3,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// Helper: Verify Brevo SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    console.warn('[Brevo SMTP] Warning: Connection could not be established immediately.', error.message);
  } else {
    console.log('[Brevo SMTP] Connection verified. Ready to dispatch transactional OTPs.');
  }
});

// ==========================================
// HELPERS & SANITIZATION
// ==========================================
const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required for authentication');
  }

  return jwt.sign(
    {
      role: user.role,
      Roll_Number: user.Roll_Number,
      organizationMemberships: user.organizationMemberships || [],
      isFirstLogin: user.isFirstLogin ?? false,
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
    isFirstLogin: user.isFirstLogin ?? false,
    organizationMemberships: user.organizationMemberships || [],
    joined_clubs: user.joined_clubs,
    joined_committee: user.joined_committee,
  };
};

// ==========================================
// 1. STRICT STUDENT REGISTRATION (TEMP STORAGE)
// ==========================================
router.post('/register', async (req, res, next) => {
  try {
    const { Roll_Number, full_name, email, password } = req.body;

    const normalizedRollNumber = normalizeRollNumber(Roll_Number);
    const cleanEmail = String(email || '').toLowerCase().trim();

    const isStudentRoll = /^(MCA|MMS)\d{5}$/i.test(normalizedRollNumber) || /^[A-Z0-9_\-]+$/i.test(normalizedRollNumber);
    if (!isStudentRoll) {
      return res.status(400).json({ message: 'Identifier must be a valid institutional roll number (e.g., MCA24001)' });
    }

    if (!cleanEmail.endsWith('@siescoms.sies.edu.in')) {
      return res.status(400).json({ message: 'Student registration requires an official institutional email (@siescoms.sies.edu.in).' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // STRICT CHECK: Does a user already exist in the main database?
    const existingUser = await User.findOne({
      $or: [{ Roll_Number: normalizedRollNumber }, { email: cleanEmail }],
    });

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this Roll Number or Email already exists. Please sign in.' });
    }

    // Hash password for temporary storage
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');

    const generatedOtp = crypto.randomInt(100000, 1000000).toString();

    // Clear any previous failed attempts for this email, then save to Temp storage
    await TempUser.deleteMany({ email: cleanEmail });
    
    const tempRecord = new TempUser({
      Roll_Number: normalizedRollNumber,
      full_name,
      email: cleanEmail,
      password_hash: hash,
      password_salt: salt,
      otp: generatedOtp
    });
    await tempRecord.save();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"CampusConnect SIESCOMS" <${process.env.BREVO_SMTP_LOGIN}>`,
      to: cleanEmail,
      subject: 'CampusConnect — Verify Your Institutional Account',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a; margin-bottom: 8px; font-size: 20px;">Welcome to CampusConnect</h2>
          <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">Hi ${full_name}, use the one-time verification code below to activate your student account.</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #047857;">${generatedOtp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-bottom: 4px;">This code is valid for <strong>10 minutes</strong>.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: 'Verification OTP sent to your institutional email. Please verify to continue.',
      data: { email: cleanEmail },
    });
  } catch (error) {
    console.error("🔥 REGISTRATION CRASH:", error);
    return next(error);
  }
});

// ==========================================
// 2. VERIFY REGISTRATION OTP & COMMIT TO MAIN DB
// ==========================================
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanOtp = String(otp || '').trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ message: 'Institutional email and 6-digit OTP are required.' });
    }

    // Look for the user in the temporary holding area
    const tempUser = await TempUser.findOne({ email: cleanEmail });

    if (!tempUser) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please register again.' });
    }

    const isOtpValid = tempUser.otp.length === cleanOtp.length && 
                       crypto.timingSafeEqual(Buffer.from(tempUser.otp), Buffer.from(cleanOtp));

    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid verification code provided.' });
    }

    // OTP is valid! Move them to the main User database permanently
    const newUser = new User({
      Roll_Number: tempUser.Roll_Number,
      full_name: tempUser.full_name,
      email: tempUser.email,
      role: 'Student',
      isVerified: true,
      isFirstLogin: true,
      password_hash: tempUser.password_hash,
      password_salt: tempUser.password_salt
    });
    
    await newUser.save();

    // Clean up the temporary record
    await TempUser.deleteMany({ email: cleanEmail });

    const token = createToken(newUser);

    return res.status(200).json({
      message: 'Account successfully verified.',
      data: {
        token,
        user: sanitizeProfile(newUser),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// 3. RESEND REGISTRATION OTP
// ==========================================
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    const cleanEmail = String(email || '').toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'Account record not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. Please log in.' });
    }

    // Refresh OTP
    const generatedOtp = crypto.randomInt(100000, 1000000).toString();
    user.otp = generatedOtp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"CampusConnect SIESCOMS" <${process.env.BREVO_SMTP_LOGIN}>`,
      to: cleanEmail,
      subject: 'CampusConnect — Resent Verification OTP',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2>Your New Verification Code</h2>
          <p>Hi ${user.full_name}, your refreshed verification code is:</p>
          <h1 style="color: #047857; letter-spacing: 6px; font-family: monospace;">${generatedOtp}</h1>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'A new verification code has been dispatched to your email.' });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// PROPER MODEL-NATIVE FACULTY SEEDER
// ==========================================
router.get('/seed-pankaj-native', async (req, res, next) => {
  try {
    const cleanEmail = 'pankajs@sies.edu.in';
    
    // 1. Completely remove any old conflicting records
    await User.deleteMany({ email: cleanEmail });

    // 2. Instantiate using the schema properly
    const faculty = new User({
      Roll_Number: 'FAC_PANKAJ', // Kept internally so schema validators don't complain if required
      full_name: 'Pankaj Srivastava',
      email: cleanEmail,
      role: 'Faculty',
      isVerified: true,
      isFirstLogin: false
    });

    // 3. Use the model's built-in hashing method so it matches login validation 100%
    if (typeof faculty.setPassword === 'function') {
      await faculty.setPassword('12345678');
    } else {
      // Fallback if setPassword isn't a direct schema method
      faculty.password_hash = require('crypto').scryptSync('12345678', 'fixed_salt', 64).toString('hex');
      faculty.password_salt = 'fixed_salt';
    }

    await faculty.save();

    return res.status(200).json({ 
      message: 'Pankaj Sir account successfully seeded using native model methods!',
      email: cleanEmail,
      password: '12345678'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/// ==========================================
// BULLETPROOF DEBUGGABLE LOGIN ROUTE
// ==========================================
router.post('/login', async (req, res, next) => {
  try {
    const { Roll_Number, email, identifier, emailOrRollNumber, password } = req.body;
    const rawIdentifier = Roll_Number || email || identifier || emailOrRollNumber;

    console.log('--- LOGIN ATTEMPT ---');
    console.log('Raw Identifier received:', rawIdentifier);
    console.log('Password received:', password ? '******' : 'MISSING');

    if (!rawIdentifier || !password) {
      return res.status(400).json({ message: 'Institutional identifier/email and password are required' });
    }

    const inputCredential = String(rawIdentifier).trim().toLowerCase();

    // Flexible case-insensitive lookup
    const user = await User.findOne({
      $or: [
        { email: new RegExp(`^${inputCredential}$`, 'i') },
        { Roll_Number: new RegExp(`^${inputCredential}$`, 'i') },
        { full_name: new RegExp(`^${inputCredential}$`, 'i') }
      ]
    }).select('+password_hash +password_salt +hash +salt +password');

    if (!user) {
      console.log('>>> LOGIN FAILED: User not found in database for:', inputCredential);
      return res.status(401).json({ message: 'Invalid institutional login credentials provided' });
    }

    console.log('>>> User found in DB:', user.email, '| Role:', user.role);

    // Password validation with explicit faculty backdoor for 12345678
    let isValidPassword = false;

    if (user.email === 'pankajs@sies.edu.in' && password === '12345678') {
      isValidPassword = true;
      console.log('>>> Faculty emergency password bypass matched successfully.');
    } else if (typeof user.validatePassword === 'function') {
      isValidPassword = user.validatePassword(password);
    } else if (user.password_hash && user.password_salt) {
      const hash = crypto.scryptSync(password, user.password_salt, 64).toString('hex');
      isValidPassword = hash === user.password_hash;
    } else if (user.password) {
      isValidPassword = user.password === password;
    }

    if (!isValidPassword) {
      console.log('>>> LOGIN FAILED: Password validation mismatch for:', user.email);
      return res.status(401).json({ message: 'Invalid institutional login credentials provided' });
    }

    const token = createToken(user);
    console.log('>>> LOGIN SUCCESS for:', user.email);

    return res.json({
      message: 'Login successful',
      data: {
        token,
        user: sanitizeProfile(user),
        promptPasswordChange: user.role === 'Faculty' && user.isFirstLogin === true,
      },
    });
  } catch (error) {
    console.error('>>> LOGIN EXCEPTION:', error);
    return next(error);
  }
});

// ==========================================
// 5. VOLUNTARY / FIRST-LOGIN PASSWORD UPDATE
// ==========================================
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    const user = await User.findById(req.user._id).select('+password_hash +password_salt');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify current password unless user is pre-provisioned and flagged for first login
    if (!user.isFirstLogin && currentPassword) {
      let isCurrentValid = false;
      if (typeof user.validatePassword === 'function') {
        isCurrentValid = user.validatePassword(currentPassword);
      } else if (user.password_hash && user.password_salt) {
        const hash = crypto.scryptSync(currentPassword, user.password_salt, 64).toString('hex');
        isCurrentValid = hash === user.password_hash;
      }
      if (!isCurrentValid) {
        return res.status(401).json({ message: 'Current password provided is incorrect.' });
      }
    }

    // Apply new password
    if (typeof user.setPassword === 'function') {
      user.setPassword(newPassword);
    } else {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(newPassword, salt, 64).toString('hex');
      user.password_salt = salt;
      user.password_hash = hash;
    }

    user.isFirstLogin = false;
    await user.save();

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return next(error);
  }
});
// ==========================================
// EMERGENCY ADMIN SEEDER
// ==========================================
router.get('/seed-admin', async (req, res, next) => {
  try {
    // 1. Wipe the old outdated admin account
    await User.deleteMany({ email: 'admin.mca25@siescoms.sies.edu.in' });

    // 2. Create a pristine, verified Admin account with the modern schema
    const admin = new User({
      Roll_Number: 'ADMIN',
      full_name: 'Admin',
      email: 'admin.mca25@siescoms.sies.edu.in',
      role: 'Admin',
      isVerified: true,
      isFirstLogin: false
    });

    // 3. Cryptographically hash the new easy-to-remember password
    admin.setPassword('12345678');
    await admin.save();

    return res.status(200).json({ 
      message: 'Admin account securely seeded.',
      login_with_option_1: 'ADMIN',
      login_with_option_2: 'admin.mca25@siescoms.sies.edu.in',
      password: '12345678'
    });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// 6. SESSION IDENTITY & DEMO RECOVERY
// ==========================================
router.get('/me', authenticate, async (req, res) => {
  return res.json({
    data: {
      user: sanitizeProfile(req.user),
    },
  });
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Institutional email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      'Roll_Number full_name email role +password_hash +password_salt'
    );

    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email address' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 Hour

    await user.save({ validateBeforeSave: false });

    return res.json({
      message: 'Demo Recovery Engine: Token generated successfully',
      token: token,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/reset-password/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('Roll_Number full_name email role +password_hash +password_salt');

    if (!user) {
      return res.status(400).json({ message: 'Recovery token is invalid or has expired' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');

    user.password_salt = salt;
    user.password_hash = hash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;