console.log('announcements route file loaded');
const express = require('express');
const Announcement =
  require('../models/Announcement');

const {
  authenticate,
  authorizeRoles,
} = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  console.log('GET announcements hit');
  const announcements =
    await Announcement.find()
      .sort({ createdAt: -1 });

  res.json({
    data: announcements,
  });
});

router.post(
  '/',
  authenticate,
  authorizeRoles('Admin'),
  async (req, res) => {

    const announcement =
      await Announcement.create({
        title: req.body.title,
        content: req.body.content,
        postedBy: req.user._id,
      });

    res.status(201).json({
      data: announcement,
    });
  }
);

module.exports = router;