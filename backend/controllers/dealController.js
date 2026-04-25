const Deal = require('../models/Deal');
const Lead = require('../models/Lead');
const Notification = require('../models/Notification');
const Ticket = require('../models/Ticket');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

const HIGH_VALUE_THRESHOLD = process.env.HIGH_VALUE_THRESHOLD || 50000;

exports.getDeals = async (req, res) => {
  try {
    const { stage, search, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (stage) query.stage = stage;
    
    const user = await User.findById(req.userId);
    if (user && user.role === 'sales') {
      query.assignedTo = req.userId;
    } else if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const deals = await Deal.find(query)
      .populate('leadId', 'name email company')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Deal.countDocuments(query);

    res.json({ deals, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deals.' });
  }
};

exports.getDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('leadId', 'name email company')
      .populate('assignedTo', 'name email');
    if (!deal) return res.status(404).json({ error: 'Deal not found.' });

    const user = await User.findById(req.userId);
    if (user && user.role === 'sales' && String(deal.assignedTo?._id || deal.assignedTo) !== String(req.userId)) {
      return res.status(403).json({ error: 'Not authorized to view this deal.' });
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deal.' });
  }
};

exports.createDeal = async (req, res) => {
  try {
    const lead = await Lead.findById(req.body.leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    
    // Auto-qualify the lead if it's not already qualified
    if (lead.status !== 'qualified' && lead.status !== 'converted') {
      lead.status = 'qualified';
      await lead.save();
    }

    const deal = new Deal(req.body);
    if (!deal.assignedTo) deal.assignedTo = req.userId;
    
    // Call AI to predict success
    try {
      const predRes = await fetch('http://localhost:8000/ai/predict-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: deal.stage,
          interactions: deal.activities ? deal.activities.length : 0,
          days_in_stage: 0
        })
      });
      const predData = await predRes.json();
      if (predData.success_probability) {
        deal.successProbability = predData.success_probability;
      }
    } catch (err) {
      console.error('AI Predict Deal Error:', err.message);
    }
    
    await deal.save();
    await deal.populate('leadId', 'name email company');
    await deal.populate('assignedTo', 'name email');

    await ActivityLog.create({
      entityId: deal._id,
      entityModel: 'Deal',
      actionType: 'CREATED',
      description: `Deal "${deal.title}" created.`,
      userId: req.userId,
    });

    if (deal.value >= HIGH_VALUE_THRESHOLD) {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          type: 'HIGH_VALUE_DEAL',
          title: 'High Value Deal Created',
          message: `🔥 High value deal "${deal.title}" (₹${deal.value}) was created by ${deal.assignedTo.name}.`,
          link: `/admin/dashboard`,
        });
      }
    }

    req.app.get('io')?.emit('deal:created', deal);
    res.status(201).json(deal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create deal.' });
  }
};

exports.updateDeal = async (req, res) => {
  try {
    const oldDeal = await Deal.findById(req.params.id);
    if (!oldDeal) return res.status(404).json({ error: 'Deal not found.' });

    // Business rule: Only assigned sales user or admin can modify deal
    const user = await User.findById(req.userId);
    if (String(oldDeal.assignedTo) !== String(req.userId) && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this deal.' });
    }

    // Business rule: Deal must have value before moving to negotiation
    if (req.body.stage === 'negotiation' && (req.body.value || oldDeal.value) <= 0) {
      return res.status(400).json({ error: 'Deal must have value before moving to negotiation' });
    }

    // Call AI Predict Deal
    try {
      const currentStage = req.body.stage || oldDeal.stage;
      const interactions = (oldDeal.activities ? oldDeal.activities.length : 0) + (req.body.activities ? req.body.activities.length : 0);
      const predRes = await fetch('http://localhost:8000/ai/predict-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: currentStage,
          interactions: interactions,
          days_in_stage: oldDeal.daysInStage || 0
        })
      });
      const predData = await predRes.json();
      if (predData.success_probability) {
        req.body.successProbability = predData.success_probability;
        
        // At Risk Notification
        if (currentStage === 'negotiation' && predData.success_probability < 40) {
          await Notification.create({
            userId: oldDeal.assignedTo,
            type: 'deal_at_risk',
            title: '⚠️ Deal at Risk',
            message: `Deal "${oldDeal.title}" in negotiation has a low success probability (${predData.success_probability}%).`,
            link: `/sales/deals`,
          });
        }
      }
    } catch (err) {
      console.error('AI Predict Deal Error:', err.message);
    }

    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('leadId', 'name email company')
      .populate('assignedTo', 'name email');

    if (req.body.stage && req.body.stage !== oldDeal.stage) {
      await ActivityLog.create({
        entityId: deal._id,
        entityModel: 'Deal',
        actionType: 'STAGE_CHANGED',
        description: `Stage moved from ${oldDeal.stage} to ${deal.stage}.`,
        userId: req.userId,
      });

      const notification = new Notification({
        userId: deal.assignedTo._id,
        type: req.body.stage === 'closed_won' ? 'deal_won' : req.body.stage === 'closed_lost' ? 'deal_lost' : 'deal_updated',
        title: `Deal ${req.body.stage === 'closed_won' ? 'Won' : req.body.stage === 'closed_lost' ? 'Lost' : 'Updated'}`,
        message: `Deal "${deal.title}" moved to ${req.body.stage}.`,
        link: `/sales/deals`,
      });
      await notification.save();

      if (req.body.stage === 'closed_won') {
        req.app.get('io')?.emit('deal:closed_won', deal);
        
        // Notify Admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            type: 'deal_won',
            title: 'Deal Won!',
            message: `Deal "${deal.title}" was closed won!`,
            link: `/admin/dashboard`,
          });
        }

        // Support Handoff
        const supportAgents = await User.find({ role: 'support' });
        const supportAgent = supportAgents.length > 0 ? supportAgents[0]._id : null;

        const ticket = new Ticket({
          title: 'New Customer Onboarding',
          description: `Onboarding required for won deal: ${deal.title}. Lead: ${deal.leadId.name} (${deal.leadId.company})`,
          customerName: deal.leadId.name,
          customerEmail: deal.leadId.email,
          priority: deal.value >= HIGH_VALUE_THRESHOLD ? 'high' : 'medium',
          assignedTo: supportAgent,
        });
        await ticket.save();

        if (supportAgent) {
          await Notification.create({
            userId: supportAgent,
            type: 'ticket_created',
            title: 'New Onboarding Ticket',
            message: `New customer onboarding required for ${deal.leadId.name}.`,
            link: `/support/tickets`,
          });
        }
      }
    }

    req.app.get('io')?.emit('deal:updated', deal);
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update deal.' });
  }
};

exports.deleteDeal = async (req, res) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found.' });
    
    req.app.get('io')?.emit('deal:deleted', { id: req.params.id });
    res.json({ message: 'Deal deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete deal.' });
  }
};

exports.addActivity = async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(
      req.params.id,
      {
        $push: { activities: { ...req.body, createdAt: new Date() } },
        lastActivity: new Date(),
      },
      { new: true }
    ).populate('leadId', 'name email company').populate('assignedTo', 'name email');
    
    if (!deal) return res.status(404).json({ error: 'Deal not found.' });

    await ActivityLog.create({
      entityId: deal._id,
      entityModel: 'Deal',
      actionType: 'NOTE_ADDED',
      description: req.body.description,
      userId: req.userId,
    });

    req.app.get('io')?.emit('deal:updated', deal);
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add activity.' });
  }
};