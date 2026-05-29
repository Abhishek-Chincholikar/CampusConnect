const crypto = require('crypto');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    Roll_Number: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
      minlength: [2, 'Roll number must contain at least 2 characters'],
      maxlength: [40, 'Roll number cannot exceed 40 characters'],
    },
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [120, 'Full name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email address is invalid'],
    },
    role: {
      type: String,
      enum: ['Student', 'Head', 'Faculty','Admin'],
      default: 'Student',
      index: true,
    },
    password_hash: {
      type: String,
      select: false,
    },
    password_salt: {
      type: String,
      select: false,
    },
    joined_clubs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
      },
    ],
    joined_committee: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.setPassword = function setPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');

  this.password_salt = salt;
  this.password_hash = hash;
};

userSchema.methods.validatePassword = function validatePassword(password) {
  if (!this.password_hash || !this.password_salt) {
    return false;
  }

  const candidateHash = crypto.scryptSync(password, this.password_salt, 64);
  const storedHash = Buffer.from(this.password_hash, 'hex');

  if (storedHash.length !== candidateHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedHash, candidateHash);
};

userSchema.methods.toSafeProfile = function toSafeProfile() {
  return {
    id: this._id,
    Roll_Number: this.Roll_Number,
    full_name: this.full_name,
    email: this.email,
    role: this.role,
    joined_clubs: this.joined_clubs,
    joined_committee: this.joined_committee,
  };
};

module.exports = mongoose.model('User', userSchema);
