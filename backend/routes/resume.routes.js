const express = require('express');
const multer = require('multer');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Multer config: store in memory for processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed.'));
    }
  },
});

router.post('/upload', authenticate, apiLimiter, upload.single('resume'), resumeController.upload);
router.get('/', authenticate, resumeController.getAll);
router.get('/:id', authenticate, resumeController.getOne);
router.delete('/:id', authenticate, resumeController.remove);

module.exports = router;
