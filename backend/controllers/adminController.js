const User = require('../models/User');
const Document = require('../models/Document');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error fetching users." });
    }
};

exports.getAllDocuments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalDocuments = await Document.countDocuments({});
        const totalPages = Math.ceil(totalDocuments / limit);

        const documents = await Document.find({})
            .sort({ createdAt: -1 })
            .populate('owner', 'username email') // Show who owns the doc
            .limit(limit)
            .skip(skip);

        res.json({ documents, page, totalPages });
    } catch (error) {
        res.status(500).json({ message: "Server error fetching all documents." });
    }
};