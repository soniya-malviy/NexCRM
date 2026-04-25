const cron = require('node-cron');
const Lead = require('../models/Lead');
const Notification = require('../models/Notification');

// Run every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Running daily follow-up check...');
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const leads = await Lead.find({
      followUpDate: { $lte: today },
      status: { $in: ['new', 'contacted', 'demo'] }, // don't notify if qualified/lost
      assignedTo: { $exists: true }
    });

    for (const lead of leads) {
      // Check if we already sent a reminder today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const existingNotif = await Notification.findOne({
        userId: lead.assignedTo,
        link: `/sales/leads/${lead._id}`,
        type: 'follow_up_due',
        createdAt: { $gte: startOfDay }
      });

      if (!existingNotif) {
        const isOverdue = lead.followUpDate < startOfDay;
        
        await Notification.create({
          userId: lead.assignedTo,
          type: 'follow_up_due',
          title: isOverdue ? 'Overdue Follow-up' : 'Follow-up Due Today',
          message: `Follow-up required for lead: ${lead.name}`,
          link: `/sales/leads/${lead._id}`,
        });
        
        // Note: In a production app, we would also emit a socket event here if the user is currently online.
      }
    }
    console.log(`[CRON] Generated reminders for ${leads.length} leads.`);
  } catch (error) {
    console.error('[CRON] Error running follow-up check:', error);
  }
});
