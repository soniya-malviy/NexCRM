const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  const Lead = require('./models/Lead');
  
  // Find Priya
  const priya = await User.findOne({ email: 'priya@gmail.com' });
  const token = jwt.sign({ userId: priya._id }, process.env.JWT_SECRET);
  
  const http = require('http');
  http.request({
    hostname: 'localhost', port: 5001, path: '/api/leads', method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  }, res => {
    let d = ''; res.on('data', c => d+=c);
    res.on('end', () => {
      const data = JSON.parse(d);
      console.log('Backend returned for Priya:', data.leads.map(l => l.name));
      process.exit(0);
    });
  }).end();
});
