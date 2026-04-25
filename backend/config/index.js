require('dotenv').config();

module.exports = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/crm_db',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
};