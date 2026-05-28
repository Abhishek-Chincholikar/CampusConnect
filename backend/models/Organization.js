const mongoose = require('mongoose');

const { Schema } = mongoose;

const organizationSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      unique: true,
      maxlength: [140, 'Organization name cannot exceed 140 characters'],
    },
    type: {
      type: String,
      enum: ['Club', 'Committee'],
      required: [true, 'Organization type is required'],
      index: true,
    },
    max_capacity: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      min: [1, 'Maximum capacity must be at least 1'],
    },
    faculty_coordinator: {
      type: String,
      required: [true, 'Faculty coordinator is required'],
      trim: true,
      maxlength: [120, 'Faculty coordinator cannot exceed 120 characters'],
    },
    student_head: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.index({ name: 1, type: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
