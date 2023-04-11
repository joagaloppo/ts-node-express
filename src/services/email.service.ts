import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, EMAIL_FROM } = process.env;
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD || !EMAIL_FROM) {
  throw new Error('Missing email configuration. Make sure you have configured the SMTP options in .env');
}

const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

transport
  .verify()
  .then(() => console.log('[server] Email server is ready to take our messages'))
  .catch(() => console.log('[server] Email server is not ready to take our messages. Check the configuration'));

const sendEmail = async (to: string, subject: string, text: string) => {
  const msg = { from: EMAIL_FROM, to, subject, text };
  await transport.sendMail(msg);
};

const sendVerificationEmail = async (to: string, token: string) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://localhost:4000/verify-email?token=${token}`;
  const text = `Please verify your email by clicking on the following link: ${verificationEmailUrl}`;
  await sendEmail(to, subject, text);
};

const sendResetPasswordEmail = async (to: string, token: string) => {
  const subject = 'Reset Password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://localhost:4000/reset-password?token=${token}`;
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
