const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { getSettingValue } = require('./settings');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get dashboard analytics metrics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // 1. Total Complaints
    const totalComplaints = await Complaint.countDocuments({});

    // 2. Status Breakdown
    const statusStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Build responsive status counters object
    const statusCounts = {
      Open: 0,
      'In Progress': 0,
      Resolved: 0,
    };
    statusStats.forEach((item) => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    // 3. Category Breakdown
    const categoryStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryCounts = {
      Plumbing: 0,
      Electrical: 0,
      Security: 0,
      Cleanliness: 0,
      'Common Area': 0,
      Others: 0,
    };
    categoryStats.forEach((item) => {
      if (categoryCounts[item._id] !== undefined) {
        categoryCounts[item._id] = item.count;
      }
    });

    // 4. Overdue Count
    const overdueThresholdDays = await getSettingValue('overdue_threshold_days', 3);
    const overdueLimitDate = new Date(Date.now() - overdueThresholdDays * 24 * 60 * 60 * 1000);
    const overdueCount = await Complaint.countDocuments({
      status: { $ne: 'Resolved' },
      createdAt: { $lt: overdueLimitDate },
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalComplaints,
        byStatus: statusCounts,
        byCategory: categoryCounts,
        overdueCount: overdueCount,
        overdueThresholdDays: Number(overdueThresholdDays),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
