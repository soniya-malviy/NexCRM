const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const User = require('../models/User');

exports.getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const matchStage = user && user.role === 'sales' ? { $match: { assignedTo: user._id } } : { $match: {} };

    const [leadsStats, dealsStats] = await Promise.all([
      Lead.aggregate([
        matchStage,
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Deal.aggregate([
        matchStage,
        {
          $group: {
            _id: '$stage',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' },
          },
        },
      ]),
    ]);

    const totalLeadsMatch = user && user.role === 'sales' ? { assignedTo: user._id } : {};
    const totalLeads = await Lead.countDocuments(totalLeadsMatch);
    const totalDeals = await Deal.countDocuments(totalLeadsMatch);
    
    const dealValueMatch = user && user.role === 'sales' ? { assignedTo: user._id, stage: { $nin: ['lost'] } } : { stage: { $nin: ['lost'] } };
    const totalDealValue = await Deal.aggregate([
      { $match: dealValueMatch },
      { $group: { _id: null, value: { $sum: '$value' } } },
    ]);

    const leadsByStatus = {};
    leadsStats.forEach(s => { leadsByStatus[s._id] = s.count; });

    const dealsByStage = {};
    let wonValue = 0;
    dealsStats.forEach(s => {
      dealsByStage[s._id] = { count: s.count, value: s.totalValue };
      if (s._id === 'won') wonValue = s.totalValue;
    });

    res.json({
      totalLeads,
      totalDeals,
      totalDealValue: totalDealValue[0]?.value || 0,
      wonDealsValue: wonValue,
      leadsByStatus,
      dealsByStage,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
};