const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Increased for development. In production this should be lower.
  message: { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500, // Increased for development purposes
  message: { error: 'Too many login attempts. Please try again after an hour.' },
});

module.exports = { limiter, authLimiter };