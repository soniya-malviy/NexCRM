const Ticket = require('../models/Ticket');
const User = require('../models/User');

exports.getAllTickets = async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;

    const user = await User.findById(req.userId);
    if (user && user.role === 'sales') {
      filters.createdBy = req.userId;
    }

    const tickets = await Ticket.find(filters)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('leadId', 'name')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets.' });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('leadId', 'name')
      .populate('messages.sender', 'name role');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    const user = await User.findById(req.userId);
    if (user && user.role === 'sales' && String(ticket.createdBy?._id || ticket.createdBy) !== String(req.userId)) {
      return res.status(403).json({ error: 'Not authorized to view this ticket.' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket.' });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    ticket.createdBy = req.userId;
    await ticket.save();
    
    await ticket.populate('createdBy', 'name email');
    await ticket.populate('leadId', 'name');

    // Broadcast via socket io
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket:created', ticket);
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket.' });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('leadId', 'name')
      .populate('messages.sender', 'name role');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Broadcast via socket io
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket:updated', ticket);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket.' });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Message content required' });

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: { sender: req.userId, content } } },
      { new: true }
    ).populate('assignedTo', 'name email')
     .populate('createdBy', 'name email')
     .populate('leadId', 'name')
     .populate('messages.sender', 'name role');

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    req.app.get('io')?.emit('ticket:updated', ticket);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add message.' });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Broadcast via socket io
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket:deleted', { id: req.params.id });
    }

    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ticket.' });
  }
};
