const Document = require('../models/Document');
const { startOfDay, subDays } = require('date-fns');

// Dashboard stats API
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = startOfDay(new Date());

        // 1. Total documents
        const totalDocuments = await Document.countDocuments({ owner: userId });

        // 2. Documents needing review
        const needsReview = await Document.countDocuments({
            owner: userId,
            $or: [
                { classification: 'Unclassified' },
                { classification: 'Other' },
                { confidenceScore: { $lt: 70 } }
            ]
        });

        // 3. Documents processed today
        const processedToday = await Document.countDocuments({
            owner: userId,
            createdAt: { $gte: today }
        });

        res.json({
            totalDocuments,
            needsReview,
            processedToday
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: 'Server error while fetching dashboard stats.' });
    }
};

// Analytics data API
exports.getAnalyticsData = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = startOfDay(new Date());
        const last30Days = subDays(new Date(), 30);

        // 1. All-time type breakdown
        const typeBreakdown = await Document.aggregate([
            { $match: { owner: userId } },
            { $group: { _id: '$classification', count: { $sum: 1 } } },
            { $project: { _id: 0, type: '$_id', count: '$count' } }
        ]);

        // 2. Daily counts over last 30 days
        const dailyCounts = await Document.aggregate([
            { $match: { owner: userId, createdAt: { $gte: last30Days } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', count: '$count' } }
        ]);

        // 3. Type breakdown for today only
        const todaysTypeBreakdown = await Document.aggregate([
            { $match: { owner: userId, createdAt: { $gte: today } } },
            { $group: { _id: '$classification', count: { $sum: 1 } } },
            { $project: { _id: 0, type: '$_id', count: '$count' } }
        ]);

        // 4. Recent activity from today
        const recentActivity = await Document.find({
            owner: userId,
            createdAt: { $gte: today }
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('originalName status classification createdAt');

        res.json({
            typeBreakdown,
            dailyCounts,
            todaysTypeBreakdown,
            recentActivity
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: 'Server error while fetching analytics.' });
    }
};
