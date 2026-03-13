import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  NOTION_CLIENT_ID: Joi.string().allow('').default(''),
  NOTION_CLIENT_SECRET: Joi.string().allow('').default(''),
  NOTION_REDIRECT_URI: Joi.string()
    .uri()
    .default('http://localhost:3000/integrations/notion/callback'),

  APP_BASE_URL: Joi.string().uri().required(),
});
