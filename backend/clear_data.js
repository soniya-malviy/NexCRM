require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected. Clearing Deals and Leads...');
    await mongoose.connection.db.collection('deals').deleteMany({});
    await mongoose.connection.db.collection('leads').deleteMany({});
    console.log('Data cleared.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
