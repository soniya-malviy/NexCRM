const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  stage: {
    type: String,
    enum: ['new', 'contacted', 'demo', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'new',
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  expectedClose: {
    type: Date,
  },
  lastActivity: {
    type: Date,
  },
  activities: [{
    type: {
      type: String,
      enum: ['note', 'call', 'email', 'meeting'],
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  successProbability: {
    type: Number,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

dealSchema.index({ stage: 1 });
dealSchema.index({ assignedTo: 1 });
dealSchema.index({ value: 1 });

dealSchema.virtual('daysInStage').get(function() {
  if (!this.updatedAt) return 0;
  return Math.floor((Date.now() - this.updatedAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Deal', dealSchema);