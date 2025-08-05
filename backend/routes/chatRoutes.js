const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getChatbotResponse } = require('../services/aiService');

// @desc    Get a response from the chatbot
// @route   POST /api/chat
// @access  Private
router.post('/', protect, async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }
    try {
        const reply = await getChatbotResponse(message);
        res.json({ reply });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get response from AI.' });
    }
});

module.exports = router;