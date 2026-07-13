const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = async (options) => {
  try {
    const emailHelper = require('../utils/email');
    await emailHelper(options);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
};

// @desc    Get all notices (Important pinned first, then by date descending)
// @route   GET /api/notices
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notices = await Notice.find({})
      .populate('authorId', 'name email')
      .sort({ isImportant: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: notices.length, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, content, isImportant } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please add a title and content' });
    }

    const notice = await Notice.create({
      title,
      content,
      isImportant: !!isImportant,
      authorId: req.user._id,
    });

    // If marked important, send notification emails to all residents
    if (notice.isImportant) {
      // Run email sending asynchronously so we don't block the API response
      User.find({ role: 'resident' })
        .then((residents) => {
          residents.forEach((resident) => {
            sendEmail({
              email: resident.email,
              subject: `📢 Important Notice: ${notice.title}`,
              message: `Hello ${resident.name},\n\nAn important notice has been posted on the Society Maintenance Tracker board:\n\nTitle: ${notice.title}\n\nContent:\n${notice.content}\n\nBest regards,\nSociety Management`,
              html: `
                <h3>📢 Important Announcement</h3>
                <p>Hello <strong>${resident.name}</strong>,</p>
                <p>An important notice has been posted on the Society Maintenance Tracker notice board:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-left: 5px solid #dc3545; margin: 15px 0;">
                  <h4 style="margin-top: 0; color: #dc3545;">${notice.title}</h4>
                  <p style="white-space: pre-wrap;">${notice.content}</p>
                </div>
                <p>Please log into your dashboard to view the full list of active notices.</p>
                <br/>
                <p>Best regards,<br/><strong>Society Management</strong></p>
              `,
            });
          });
        })
        .catch((err) => console.error('Failed to query residents for email blast:', err));
    }

    res.status(201).json({ success: true, notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    await notice.deleteOne();

    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
