const mongoose = require('mongoose');

const announcementSchema =
  new mongoose.Schema(
    {
      title: String,
      content: String,
      postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  'Announcement',
  announcementSchema
);