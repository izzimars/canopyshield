import getTemplate from './index';

type EmailTemplateData = {
  email?: string;
  otp?: string;
  duration?: number;
  organizationName?: string;
  url?: string;
  token?: string;
  role?: string;
};

const canopyTemplate = (messageType: string, data: EmailTemplateData): string => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <title>CanopyShield</title>

      <style>
        body {
          font-family: Inter, sans-serif;
          margin: 0;
          padding: 40px;
          background-color: #F9FAFB;
        }

        .email-container {
          max-width: 624px;
          margin: 0 auto;
          background-color: #FFFFFF;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        #email-info {
          color: #323232;
        }

        .footer {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #6B7280;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
        }

        @media screen and (max-width: 450px) {
          .email-container {
            padding: 20px;
          }

          body {
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        ${getTemplate(messageType, data)}

        <div class="footer">
          <p style="margin: 8px 0;">Best regards,</p>
          <p style="margin: 8px 0;"><strong>The CanopyShield Team</strong></p>
          <p style="margin: 8px 0;">canopyshield.io</p>
        </div>
      </div>
    </body>
  </html>
`;

export default canopyTemplate;