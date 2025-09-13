// utils/validation.js
const Joi = require('joi');

// =========================
// Registration Validation
// =========================
const validateRegistration = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),

    email: Joi.string().email().required(),

    password: Joi.string().min(6).required(),

    role: Joi.string().valid('farmer', 'doctor', 'admin').default('farmer'),

    // Profile object with all nested fields
    profile: Joi.object({
      phone: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .optional()
        .messages({
          'string.pattern.base': 'Phone number must be exactly 10 digits',
        }),

      location: Joi.object({
        state: Joi.string().optional().allow('', null),
        district: Joi.string().optional().allow('', null),
        village: Joi.string().optional().allow('', null),
      }).optional().default({}),

      farmDetails: Joi.object({
        farmSize: Joi.number().min(0).default(0),
        cropTypes: Joi.array()
          .items(
            Joi.string().valid(
              'rice',
              'wheat',
              'corn',
              'tomato',
              'potato',
              'cotton',
              'sugarcane',
              'soybean',
              'other'
            )
          )
          .default([]),
        farmingExperience: Joi.number().min(0).default(0),
      }).optional().default({ farmSize: 0, cropTypes: [], farmingExperience: 0 }),

      preferredLanguage: Joi.string().optional().allow('', null),

      age: Joi.number().min(0).optional().allow(null),
      gender: Joi.string()
        .valid('male', 'female', 'other')
        .optional()
        .allow('', null),
    }).optional().default({}),
  });

  return schema.validate(data, { abortEarly: false });
};

// =========================
// Login Validation
// =========================
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = { validateRegistration, validateLogin };
