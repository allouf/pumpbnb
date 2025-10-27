import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      { abortEarly: false }
    );

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      throw new ValidationError(message);
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  address: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Ethereum address format',
    }),

  txHash: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{64}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid transaction hash format',
    }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  tokenMetadata: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    symbol: Joi.string().min(1).max(10).required(),
    description: Joi.string().max(500).required(),
    image: Joi.string().uri().required(),
    website: Joi.string().uri().optional(),
    twitter: Joi.string().optional(),
    telegram: Joi.string().optional(),
    discord: Joi.string().optional(),
  }),
};
