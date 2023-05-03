import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

const NODE_ENV = process.env.NODE_ENV || 'development';

dotenv.config({ path: path.resolve(__dirname, `.env.${NODE_ENV}`) });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required().description('Database URL'),
    CLIENT_URL: Joi.string().required().description('Client URL'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXP: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXP: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_PASSWORD_EXP: Joi.number().default(30).description('minutes after which set password token expire'),
    SMTP_HOST: Joi.string().description('server that will send the emails').required(),
    SMTP_PORT: Joi.number().description('port to connect to the email server').required(),
    SMTP_USER: Joi.string().description('username for email server').required(),
    SMTP_PASS: Joi.string().description('password for email server').required(),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app').required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  database_url: envVars.DATABASE_URL,
  client_url: envVars.CLIENT_URL,
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExp: envVars.JWT_ACCESS_EXP,
    refreshExp: envVars.JWT_REFRESH_EXP,
    passwordExp: envVars.JWT_PASSWORD_EXP,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
      },
    },
    from: envVars.EMAIL_FROM,
  },
};

export default config;
