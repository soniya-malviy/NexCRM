const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  entityModel: {
    type: String,
    enum: ['Lead', 'Deal'],
    required: true,
  },
  actionType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

activityLogSchema.index({ entityId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
