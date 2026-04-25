const Lead = require('../models/Lead');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

exports.getLeads = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const user = await User.findById(req.userId);
    if (user && user.role === 'sales') {
      query.assignedTo = req.userId;
    } else if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Lead.countDocuments(query);

    res.json({ leads, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads.' });
  }
};

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('noteHistory.author', 'name');
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    
    const user = await User.findById(req.userId);
    if (user && user.role === 'sales' && String(lead.assignedTo?._id || lead.assignedTo) !== String(req.userId)) {
      return res.status(403).json({ error: 'Not authorized to view this lead.' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead.' });
  }
};

exports.createLead = async (req, res) => {
  try {
    const lead = new Lead(req.body);
    
    if (!lead.assignedTo && req.userId) {
      lead.assignedTo = req.userId;
    }

    // Call AI Service
    try {
      // 1. Detect Duplicates
      const existingLeads = await Lead.find({}, 'name email company').sort({ createdAt: -1 }).limit(1000);
      const dupRes = await fetch('http://localhost:8000/ai/detect-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_lead: { email: lead.email, name: lead.name, company: lead.company },
          existing_leads: existingLeads.map(l => ({ email: l.email, name: l.name, company: l.company }))
        })
      });
      const dupData = await dupRes.json();
      if (dupData.is_duplicate) {
        lead.isDuplicate = true;
      }

      // 2. Score Lead
      const scoreRes = await fetch('http://localhost:8000/ai/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: [{ email: lead.email, name: lead.name, company: lead.company, phone: lead.phone, source: lead.source, message: lead.message }]
        })
      });
      const scoreData = await scoreRes.json();
      if (scoreData.scores && scoreData.scores.length > 0) {
        lead.score = scoreData.scores[0].score;
        lead.priority = scoreData.scores[0].priority;
      }
    } catch (aiError) {
      console.error('AI Service Error during createLead:', aiError.message);
    }
    
    await lead.save();
    
    if (lead.assignedTo) {
      await lead.populate('assignedTo', 'name email');

      await Notification.create({
        userId: lead.assignedTo,
        type: 'lead_created',
        title: 'New Lead Created',
        message: `New lead "${lead.name}" has been assigned to you.`,
        link: `/sales/leads/${lead._id}`,
      });
    }

    const creatorId = req.userId || (lead.assignedTo ? lead.assignedTo._id : null);
    if (creatorId) {
      await ActivityLog.create({
        entityId: lead._id,
        entityModel: 'Lead',
        actionType: 'CREATED',
        description: `Lead "${lead.name}" created.`,
        userId: creatorId,
      });
      
      // AI Notifications
      if (lead.isDuplicate) {
        await Notification.create({
          userId: creatorId,
          type: 'duplicate_lead',
          title: '⚠️ Duplicate Detected',
          message: `Lead "${lead.name}" appears to be a duplicate.`,
          link: `/sales/leads/${lead._id}`,
        });
      }
      if (lead.priority === 'HIGH') {
        await Notification.create({
          userId: creatorId,
          type: 'high_priority',
          title: '🔥 High Priority Lead',
          message: `Lead "${lead.name}" scored ${lead.score} and is marked HIGH priority.`,
          link: `/sales/leads/${lead._id}`,
        });
      }
    }

    req.app.get('io')?.emit('lead:created', lead);
    res.status(201).json(lead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create lead.' });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const oldLead = await Lead.findById(req.params.id);
    if (!oldLead) return res.status(404).json({ error: 'Lead not found.' });

    const user = await User.findById(req.userId);
    if (oldLead.assignedTo && oldLead.assignedTo.toString() !== req.userId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this lead.' });
    }

    if (req.body.status === 'contacted' && !oldLead.followUpDate && !req.body.followUpDate) {
      return res.status(400).json({ error: 'Follow-up date must be set when marking as Contacted.' });
    }

    // AI Note Summarization
    if (req.body.notes && req.body.notes !== oldLead.notes) {
      try {
        const sumRes = await fetch('http://localhost:8000/ai/summarize-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: req.body.notes })
        });
        const sumData = await sumRes.json();
        if (sumData.summary) {
          req.body.aiSummary = sumData.summary;
        }
      } catch (aiError) {
        console.error('AI Service Error during summarize-note:', aiError.message);
      }
    }

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'name email');

    // Notify of assignment change
    if (req.body.assignedTo && String(req.body.assignedTo) !== String(oldLead.assignedTo)) {
      const notification = await Notification.create({
        userId: req.body.assignedTo,
        type: 'lead_assigned',
        title: 'Lead Assigned',
        message: `Lead "${lead.name}" has been assigned to you.`,
        link: `/sales/leads/${lead._id}`,
      });
      req.app.get('io')?.emit('lead:assigned', { lead, notification });
      
      await ActivityLog.create({
        entityId: lead._id,
        entityModel: 'Lead',
        actionType: 'ASSIGNED',
        description: `Lead assigned.`,
        userId: req.userId,
      });
    }

    if (req.body.status && req.body.status !== oldLead.status) {
      await ActivityLog.create({
        entityId: lead._id,
        entityModel: 'Lead',
        actionType: 'STATUS_CHANGED',
        description: `Status changed from ${oldLead.status} to ${req.body.status}.`,
        userId: req.userId,
      });
    }

    if (req.body.notes && req.body.notes !== oldLead.notes) {
      await ActivityLog.create({
        entityId: lead._id,
        entityModel: 'Lead',
        actionType: 'NOTE_ADDED',
        description: 'Notes updated.',
        userId: req.userId,
      });
    }

    if (req.body.followUpDate && String(req.body.followUpDate) !== String(oldLead.followUpDate)) {
      await ActivityLog.create({
        entityId: lead._id,
        entityModel: 'Lead',
        actionType: 'FOLLOWUP_SCHEDULED',
        description: `Follow-up scheduled for ${new Date(req.body.followUpDate).toLocaleDateString()}`,
        userId: req.userId,
      });
    }

    req.app.get('io')?.emit('lead:updated', lead);
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead.' });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    
    req.app.get('io')?.emit('lead:deleted', { id: req.params.id });
    res.json({ message: 'Lead deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead.' });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const activities = await ActivityLog.find({ entityId: req.params.id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities.' });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Note text is required.' });

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    lead.noteHistory.push({
      text,
      author: req.userId,
      createdAt: new Date()
    });

    // AI Summary logic for the newest note
    try {
      const sumRes = await fetch('http://localhost:8000/ai/summarize-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: text })
      });
      const sumData = await sumRes.json();
      if (sumData.summary) {
        lead.aiSummary = sumData.summary;
      }
    } catch (err) {
      console.error('AI Summary Error:', err.message);
    }

    await lead.save();
    const updatedLead = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email')
      .populate('noteHistory.author', 'name');

    res.json(updatedLead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note.' });
  }
};