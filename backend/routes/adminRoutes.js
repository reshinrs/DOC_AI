const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getAllUsers, getAllDocuments } = require('../controllers/adminController');

router.route('/users').get(protect, adminOnly, getAllUsers);
router.route('/documents').get(protect, adminOnly, getAllDocuments);

module.exports = router;