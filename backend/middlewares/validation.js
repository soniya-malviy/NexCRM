const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
};

const schemas = {
  register: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('admin', 'sales', 'support'),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  lead: Joi.object({
    name: Joi.string().required().min(2).max(100),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('').optional(),
    company: Joi.string().allow('').optional(),
    interest: Joi.string().allow('').optional(),
    message: Joi.string().allow('').optional(),
    status: Joi.string().valid('new', 'contacted', 'demo', 'qualified', 'lost'),
    source: Joi.string().valid('website', 'referral', 'linkedin', 'cold_call', 'other'),
    assignedTo: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional(),
    followUpDate: Joi.date().allow(null, '').optional(),
  }),

  leadUpdate: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('').optional(),
    company: Joi.string().allow('').optional(),
    interest: Joi.string().allow('').optional(),
    message: Joi.string().allow('').optional(),
    status: Joi.string().valid('new', 'contacted', 'demo', 'qualified', 'lost').optional(),
    source: Joi.string().valid('website', 'referral', 'linkedin', 'cold_call', 'other').optional(),
    assignedTo: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional(),
    followUpDate: Joi.date().allow(null, '').optional(),
  }),

  deal: Joi.object({
    title: Joi.string().required().min(2).max(200),
    value: Joi.number().required().min(0),
    currency: Joi.string().default('INR'),
    stage: Joi.string().valid('new', 'contacted', 'demo', 'negotiation', 'closed_won', 'closed_lost'),
    leadId: Joi.string().required(),
    assignedTo: Joi.string().allow('').optional(),
    expectedClose: Joi.date().allow(null, '').optional(),
    priority: Joi.string().valid('low', 'medium', 'high'),
  }),

  message: Joi.object({
    channelId: Joi.string().when('isDirect', {
      is: false,
      then: Joi.required(),
    }),
    content: Joi.string().required().min(1).max(2000),
    isDirect: Joi.boolean().default(false),
    recipientId: Joi.string().when('isDirect', {
      is: true,
      then: Joi.required(),
    }),
  }),
};

module.exports = { validate, schemas };