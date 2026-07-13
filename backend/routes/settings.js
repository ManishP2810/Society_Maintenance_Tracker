const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

// Helper to get settings or return default
const getSettingValue = async (key, defaultValue) => {
  try {
    let setting = await Settings.findOne({ key });
    if (!setting) {
      setting = await Settings.create({ key, value: defaultValue });
    }
    return setting.value;
  } catch (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return defaultValue;
  }
};

// @desc    Get global settings
// @route   GET /api/settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const overdueThresholdDays = await getSettingValue('overdue_threshold_days', 3);
    res.status(200).json({
      success: true,
      settings: {
        overdueThresholdDays: Number(overdueThresholdDays),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private/Admin
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { overdueThresholdDays } = req.body;

    if (overdueThresholdDays === undefined || isNaN(overdueThresholdDays) || Number(overdueThresholdDays) < 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid threshold number of days' });
    }

    let setting = await Settings.findOne({ key: 'overdue_threshold_days' });
    if (!setting) {
      setting = new Settings({ key: 'overdue_threshold_days', value: Number(overdueThresholdDays) });
    } else {
      setting.value = Number(overdueThresholdDays);
    }
    await setting.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        overdueThresholdDays: Number(setting.value),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = {
  router,
  getSettingValue
};
