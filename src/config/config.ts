import 'dotenv/config';

// check if database url is undefined and if so, use throw an error
if (!process.env.DATABASE_URL) {
  throw new Error('Please configure your database url in .env file');
}

// check if jwt keys are undefined and if so, use throw an error
if (
  !process.env.JWT_SECRET ||
  !process.env.JWT_ACCESS_EXPIRATION_MINUTES ||
  !process.env.JWT_REFRESH_EXPIRATION_DAYS ||
  !process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES ||
  !process.env.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES
) {
  throw new Error('Please configure your JWT data in .env file');
}

// check if google keys are undefined and if so, use throw an error
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Please configure your Google OAuth credentials in .env file');
}

// check if email SMTP keys are undefined and if so, use throw an error
if (
  !process.env.SMTP_HOST ||
  !process.env.SMTP_PORT ||
  !process.env.SMTP_USERNAME ||
  !process.env.SMTP_PASSWORD ||
  !process.env.EMAIL_FROM
) {
  throw new Error('Please configure your email data in .env file');
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  database_url: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiratonMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpiratonDays: process.env.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpiratonMinutes: process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpiratonMinutes: process.env.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM,
  },
};

export default config;
