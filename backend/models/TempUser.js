const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
  Roll_Number: { type: String, required: true, uppercase: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  password_hash: { type: String, required: true },
  password_salt: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Self-destructs after 10 mins
});

module.exports = mongoose.model('TempUser', tempUserSchema);