import nodemailer from 'nodemailer';
import canopyTemplate from '../../shared/templates/canopy_template';
import { logger } from '../../config/logger';

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
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_FROM,
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
