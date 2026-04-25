require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const uri = process.env.MONGO_URI || 'mongodb://mongodb:27017/crm_db';

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const users = [
      { name: 'Admin User', email: 'admin@crm.com', password: 'password123', role: 'admin' },
      { name: 'Sales Rep', email: 'sales@crm.com', password: 'password123', role: 'sales' },
      { name: 'Support Agent', email: 'support@crm.com', password: 'password123', role: 'support' },
    ];

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const user = new User(u);
        await user.save();
        console.log(`Created: ${u.email} / password123`);
      } else {
        console.log(`Exists: ${u.email}`);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB', err);
    process.exit(1);
  });
