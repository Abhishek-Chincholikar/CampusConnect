const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Report = require('../models/Reports');
const {
  authenticate,
  authorizeRoles,
} = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.get('/', async (req, res) => {
  const reports = await Report.find()
    .populate('organization','name')
    .populate('uploadedBy', 'full_name')
    .sort({ createdAt: -1 });

  res.json({
  data: reports,
  });
});

router.post(
  '/upload',
  authenticate,
  authorizeRoles(
  'Admin',
  'Head'),
  upload.single('pdf'),
  async (req, res) => {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'raw',
              folder: 'campusconnect/reports',
            },
            (error, uploaded) => {
              if (error) reject(error);
              else resolve(uploaded);
            }
          )
          .end(req.file.buffer);
      });

      const report = await Report.create({
        title: req.body.title,
        fileUrl: result.secure_url,
        organization:req.body.organization,
        uploadedBy: req.user._id,
      });

      res.status(201).json(report);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

module.exports = router;