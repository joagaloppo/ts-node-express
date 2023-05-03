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

const sendEmail = async (to: string, subject: string, html: string) => {
  const msg = { from: `App ${config.email.from}`, to, subject, html };
  await transport.sendMail(msg);
};

const sendPasswordEmail = async (to: string, token: string) => {
  const subject = 'Set Password';
  const url = `${config.client_url}/set-password?token=${token}`;
  const html = `<div style="background-color: #f3f4f6; padding: 20px;">
<div style="background-color: white; padding: 20px 80px; border-radius: 2px; text-align: center; width: fit-content; margin: 0 auto;">
  <h1 style="font-size: 24px; margin-bottom:6px">Set Password</h1>
  <p style="font-size:18px; margin-bottom: 10px; margin-top:0px">Here is your link to set your password.</p>
  <a href="${url}" style="text-decoration: none;">
    <button style="background-color: #3b82f6; border: none; border-radius:4px; color: white; padding: 16px 40px; text-align: center; display: inline-block; font-size: 16px; margin: 10px auto; cursor:pointer">
      Set Password
    </button>
  </a>
  <p style="font-size:12px margin-bottom: 10px; margin-top: 10px">If you did not request this, please ignore this email. <br /> This link will expire in ${config.jwt.passwordExp} minutes.</p>
</div>`;
  await sendEmail(to, subject, html);
};

const emailService = {
  transport,
  sendEmail,
  sendPasswordEmail,
};

export default emailService;
