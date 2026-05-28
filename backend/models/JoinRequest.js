const mongoose = require('mongoose');

const { Schema } = mongoose;

const joinRequestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant user is required'],
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Tech_Round', 'Interview', 'Voting', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

joinRequestSchema.index({ user: 1, organization: 1 }, { unique: true });
joinRequestSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model('JoinRequest', joinRequestSchema);
