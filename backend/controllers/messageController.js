const { Channel, Message } = require('../models/Message');

exports.getChannels = async (req, res) => {
  try {
    const channels = await Channel.find({
      $or: [{ type: 'public' }, { members: req.userId }],
    }).populate('members', 'name email').populate('createdBy', 'name');
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channels.' });
  }
};

exports.createChannel = async (req, res) => {
  try {
    const channel = new Channel({ ...req.body, createdBy: req.userId });
    await channel.save();
    await channel.populate('members', 'name email');
    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create channel.' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { channelId, page = 1, limit = 50 } = req.query;
    
    const query = channelId ? { channelId } : {
      $or: [{ senderId: req.userId }, { recipientId: req.userId }],
      isDirect: true,
    };

    const messages = await Message.find(query)
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);
    res.json({ messages: messages.reverse(), total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { channelId, content, isDirect, recipientId } = req.body;
    
    const message = new Message({
      senderId: req.userId,
      channelId: isDirect ? null : channelId,
      content,
      isDirect,
      recipientId: isDirect ? recipientId : null,
    });
    await message.save();
    await message.populate('senderId', 'name email');
    if (recipientId) await message.populate('recipientId', 'name email');

    const io = req.app.get('io');
    if (isDirect) {
      io?.to(`user:${recipientId}`).emit('message:received', message);
      io?.to(`user:${req.userId}`).emit('message:received', message);
    } else {
      io?.to(`channel:${channelId}`).emit('message:received', message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
};