const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'crm_record', 'file'],
    default: 'text',
  },
  crmRecord: {
    type: {
      type: String,
      enum: ['lead', 'deal'],
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  isDirect: {
    type: Boolean,
    default: false,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1 });

const Channel = mongoose.model('Channel', channelSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Channel, Message };