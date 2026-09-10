const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
  Roll_Number: { type: String, required: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Automatically deletes after 10 minutes
});

module.exports = mongoose.model('TempUser', tempUserSchema);