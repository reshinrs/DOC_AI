const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAnalyticsData, getDashboardStats } = require('../controllers/analyticsController');

router.route('/').get(protect, getAnalyticsData);
router.route('/stats').get(protect, getDashboardStats); // Add this line

module.exports = router;