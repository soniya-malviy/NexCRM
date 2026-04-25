const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'demo', 'qualified', 'lost'],
    default: 'new',
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'linkedin', 'cold_call', 'other'],
    default: 'website',
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  interest: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  aiSummary: {
    type: String,
    trim: true,
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
  },
  isDuplicate: {
    type: Boolean,
    default: false,
  },
  noteHistory: [{
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  lastContacted: {
    type: Date,
  },
  followUpDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Lead', leadSchema);