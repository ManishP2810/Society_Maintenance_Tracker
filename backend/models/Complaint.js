const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    required: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  actorName: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a complaint title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a complaint description'],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: ['Plumbing', 'Electrical', 'Security', 'Cleanliness', 'Common Area', 'Others'],
    },
    photoUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved'],
      default: 'Open',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to initialize status history on creation
complaintSchema.pre('save', function (next) {
  if (this.isNew && this.statusHistory.length === 0) {
    // When creating, add the first history log
    // The actor is set to residentId by default
    this.statusHistory.push({
      status: 'Open',
      actor: this.residentId,
      actorName: 'Resident (System Auto)',
      note: 'Complaint raised by resident.',
      timestamp: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
