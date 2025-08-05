const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { analyzeResume } = require('../controllers/resumeController');

// Configure Multer for in-memory storage, as we don't need to save the resume
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route('/analyze').post(protect, upload.single('resume'), analyzeResume);

module.exports = router;