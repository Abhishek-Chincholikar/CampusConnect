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
      enum: ['Student', 'Head', 'Faculty'],
      default: 'Student',
      index: true,
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

module.exports = mongoose.model('User', userSchema);
