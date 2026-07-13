const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { getSettingValue } = require('./settings');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/email');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer File Filter
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private/Resident
router.post('/', protect, authorize('resident'), upload.single('photo'), async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    let photoUrl = '';
    if (req.file) {
      // Return a URL path that can be served statically
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      photoUrl,
      residentId: req.user._id,
    });

    res.status(201).json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all complaints (Admin view with filters)
// @route   GET /api/complaints
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { category, status, date, overdue } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      // Filter complaints raised on or after the selected date
      const filterDate = new Date(date);
      query.createdAt = { $gte: filterDate };
    }

    // Fetch dynamic overdue threshold settings
    const overdueThresholdDays = await getSettingValue('overdue_threshold_days', 3);
    const overdueLimitDate = new Date(Date.now() - overdueThresholdDays * 24 * 60 * 60 * 1000);

    if (overdue === 'true') {
      // Overdue definition: status is NOT Resolved AND created before (now - threshold)
      query.status = { $ne: 'Resolved' };
      query.createdAt = { ...query.createdAt, $lt: overdueLimitDate };
    }

    let complaints = await Complaint.find(query)
      .populate('residentId', 'name email')
      .sort({ createdAt: -1 });

    // Format output to dynamically flag items as overdue
    const formattedComplaints = complaints.map(c => {
      const isOverdue = c.status !== 'Resolved' && new Date(c.createdAt) < overdueLimitDate;
      return {
        ...c.toObject(),
        isOverdue,
      };
    });

    // Custom sorting: overdue items at the top
    formattedComplaints.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json({ success: true, count: formattedComplaints.length, complaints: formattedComplaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get resident's own complaints
// @route   GET /api/complaints/my
// @access  Private/Resident
router.get('/my', protect, authorize('resident'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ residentId: req.user._id })
      .sort({ createdAt: -1 });

    const overdueThresholdDays = await getSettingValue('overdue_threshold_days', 3);
    const overdueLimitDate = new Date(Date.now() - overdueThresholdDays * 24 * 60 * 60 * 1000);

    const formattedComplaints = complaints.map(c => {
      const isOverdue = c.status !== 'Resolved' && new Date(c.createdAt) < overdueLimitDate;
      return {
        ...c.toObject(),
        isOverdue,
      };
    });

    res.status(200).json({ success: true, count: formattedComplaints.length, complaints: formattedComplaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update complaint status (with history logging and email)
// @route   PUT /api/complaints/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status || !['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status' });
    }

    const complaint = await Complaint.findById(req.params.id).populate('residentId', 'name email');
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Update status
    complaint.status = status;

    // Append to status history
    complaint.statusHistory.push({
      status,
      actor: req.user._id,
      actorName: req.user.name + ' (Admin)',
      note: note || `Status updated to ${status} by admin.`,
      timestamp: new Date(),
    });

    await complaint.save();

    // Send email notification to resident
    const resident = complaint.residentId;
    if (resident && resident.email) {
      sendEmail({
        email: resident.email,
        subject: `⚠️ Update on Complaint #${complaint._id.toString().slice(-6)}: ${status}`,
        message: `Hello ${resident.name},\n\nYour complaint status has been updated.\n\nComplaint: ${complaint.title}\nNew Status: ${status}\nAdmin Note: ${note || 'None'}\n\nPlease check your dashboard for details.\n\nBest regards,\nSociety Management`,
        html: `
          <h3>🔧 Complaint Status Update</h3>
          <p>Hello <strong>${resident.name}</strong>,</p>
          <p>Your complaint has received an update from the administration.</p>
          <table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd; margin: 15px 0;">
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Complaint ID</th>
              <td style="padding: 8px; border: 1px solid #ddd;">#${complaint._id.toString().slice(-6)}</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Title</th>
              <td style="padding: 8px; border: 1px solid #ddd;">${complaint.title}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Category</th>
              <td style="padding: 8px; border: 1px solid #ddd;">${complaint.category}</td>
            </tr>
            <tr>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">New Status</th>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong><span style="color: ${status === 'Resolved' ? '#28a745' : status === 'In Progress' ? '#ffc107' : '#dc3545'};">${status}</span></strong></td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Admin Note</th>
              <td style="padding: 8px; border: 1px solid #ddd; font-style: italic;">"${note || 'No additional note provided.'}"</td>
            </tr>
          </table>
          <p>You can track the complete history of this ticket directly from your account page.</p>
          <br/>
          <p>Best regards,<br/><strong>Society Management</strong></p>
        `,
      }).catch(err => console.error('Failed to send status update email:', err));
    }

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update complaint priority
// @route   PUT /api/complaints/:id/priority
// @access  Private/Admin
router.put('/:id/priority', protect, authorize('admin'), async (req, res) => {
  try {
    const { priority } = req.body;

    if (!priority || !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid priority' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.priority = priority;
    await complaint.save();

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
