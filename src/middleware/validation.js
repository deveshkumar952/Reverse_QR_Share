const Joi = require('joi');
const { v4: uuidValidate } = require('uuid');

// Validation schemas
const schemas = {
  createSession: Joi.object({
    expiryMinutes: Joi.number().integer().min(1).max(1440).optional()
  }),

  uploadInit: Joi.object({
    sessionId: Joi.string().custom((value, helpers) => {
      if (!uuidValidate(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required(),
    fileName: Joi.string().min(1).max(255).required(),
    size: Joi.number().integer().min(1).max(100 * 1024 * 1024).required(), // 100MB max
    mimeType: Joi.string().min(1).max(100).required()
  }),

  uploadComplete: Joi.object({
    sessionId: Joi.string().custom((value, helpers) => {
      if (!uuidValidate(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required(),
    uploadId: Joi.string().custom((value, helpers) => {
      if (!uuidValidate(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).required()
  }),

  sessionId: Joi.string().custom((value, helpers) => {
    if (!uuidValidate(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }).required()
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property]);

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req[property] = value;
    next();
  };
};

// Validate UUID parameters
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!uuidValidate(value)) {
      return res.status(400).json({
        error: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateUUID,
  schemas
};
