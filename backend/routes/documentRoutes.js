const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');

// --- CONTROLLER IMPORTS ---
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  reExtractDocument,
  reClassifyDocument,
  compareDocuments,
  clearComparisonResults,
  convertAndDownloadDocument,
  summarizeDocument,
  askQuestion,
  generateReport, // Added this
} = require('../controllers/documentController');

// --- MULTER CONFIG ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// Document list and upload
router.route('/')
  .get(protect, getDocuments);

router.route('/upload')
  .post(protect, upload.single('document'), uploadDocument);

// Single document operations
router.route('/:id')
  .get(protect, getDocumentById)
  .delete(protect, deleteDocument);

router.route('/:id/summarize')
  .post(protect, summarizeDocument);

router.route('/:id/ask')
  .post(protect, askQuestion);

router.route('/:id/report')
  .get(protect, generateReport); // New route to generate PDF report

router.route('/:id/re-extract')
  .post(protect, reExtractDocument);

router.route('/:id/re-classify')
  .post(protect, reClassifyDocument);

router.route('/:id/convert')
  .get(protect, convertAndDownloadDocument);

// Document comparison
router.route('/:id/compare')
  .post(protect, compareDocuments)
  .delete(protect, clearComparisonResults);

module.exports = router;
