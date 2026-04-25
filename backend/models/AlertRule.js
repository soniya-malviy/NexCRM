const mongoose = require('mongoose');

const alertRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  condition: {
    type: {
      type: String,
      enum: ['no_followup', 'deal_value_high', 'deal_stuck', 'lead_cold', 'custom'],
      required: true,
    },
  },
  params: {
    type: mongoose.Schema.Types.Mixed,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AlertRule', alertRuleSchema);