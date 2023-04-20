import nodemailer from 'nodemailer';
import logger from '../config/logger';
import config from '../config/config';

const transport = nodemailer.createTransport(config.email.smtp);

if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('email server is ready to take our messages'))
    .catch(() => logger.error('there was an error connecting to the email server'));
}

const sendEmail = async (to: string, subject: string, text: string) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

const sendVerificationEmail = async (to: string, token: string) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `${config.email.verificationUrl}?token=${token}`;
  const text = `Please verify your email by clicking on the following link: ${verificationEmailUrl}`;
  await sendEmail(to, subject, text);
};

const sendResetPasswordEmail = async (to: string, token: string) => {
  const subject = 'Reset Password';
  const resetPasswordUrl = `${config.email.resetPasswordUrl}?token=${token}`;
  const text = `Please reset your password by clicking on the following link: ${resetPasswordUrl}`;
  await sendEmail(to, subject, text);
};

const emailService = {
  transport,
  sendEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
};

export default emailService;
