import nodemailer from 'nodemailer';
import canopyTemplate from '../../shared/templates/canopy_template';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

/**
 * Send email using Nodemailer with SMTP
 */
const MailService = async (
  subject: string,
  type: string,
  data: { email: string; [key: string]: any },
  bcc?: string | string[],
  cc?: string | string[],
  attachment?: any
) => {
  if (process.env.NODE_ENV === 'test') {
    logger.debug('Skipping mail send in test environment');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: 587,
    secure: Number(env.MAIL_PORT) === 465,
    requireTLS: Number(env.MAIL_PORT) !== 465,
    connectionTimeout: 10000,
    auth: {
      user: env.USER_MAIL,
      pass: env.EMAIL_API_KEY,
    },
  });
  
  const mailOptions = {
    from: env.EMAIL_FROM,
    cc,
    bcc,
    to: data.email,
    subject,
    html: canopyTemplate(type, data),
    attachments: attachment,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`sent using ${mailOptions.from}`, { messageId: info.messageId });
    return info;
  } catch (error: any) {
    logger.error(error.message);
    throw error;
  }
};

export default MailService;
