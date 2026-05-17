export const userValidationOTP = (data: { otp: string; duration: number }) => `
<div id="email-info" style="font-family: 'Inter', sans-serif; color: #323232;">
  <img src="https://via.placeholder.com/150?text=CanopyShield" alt="CanopyShield Logo" style="max-width: 150px;" />
  <div style="padding: 30px 0px; border-bottom: 2px solid #EDF2F7;"></div>
  <div>
    <h4 style="font-weight: 700; font-size: 20px; line-height: 26px; letter-spacing: -0.04em; color: #323232; padding-bottom: 24px;">
      Welcome to CanopyShield
    </h4>
    <p style="font-weight: 400; font-size: 16px; line-height: 24px; color: #425466;">
      Your verification code is <b>${data.otp}</b>
    </p>
    <p style="font-family: 'Inter'; font-weight: 400; font-size: 16px; line-height: 24px; color: #425466;">
        The OTP expires in <span><b>${data.duration} minutes</b></span>
    </p>
    <p style="font-size: 14px; color: #6B7280;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>
`;

export const userInvitation = (data: { organizationName: string; url: string; token: string; role?: string }) => `
<div id="email-info" style="font-family: 'Inter', sans-serif; color: #323232;">
  <div>
    <img src="https://via.placeholder.com/150?text=CanopyShield" alt="CanopyShield logo" style="max-width: 150px;" />
  </div>
  <div>
    <h4 style="font-weight: 700; font-size: 20px; line-height: 26px; color: #323232; padding-bottom: 16px;">
      You're invited to join ${data.organizationName} on CanopyShield
    </h4>
    <div style="color: #323232; font-size: 16px; line-height: 20px;">
      <p style="font-weight: 700;">Hello,</p>
      <p>${data.organizationName} has invited you to join their team on CanopyShield.</p>
      <p>CanopyShield helps teams manage safety workflows, incident reporting, and secure access across your organization.</p>
    </div>

    <div style="margin: 20px 0 20px 0;">
      <a href="${data.url}/invite?token=${data.token}${data.role ? `&role=${data.role}` : ''}" style="display:inline-block;padding:12px 24px;border-radius:12px;background-color:#007AFF;color:#FFFFFF;font-weight:600;text-decoration:none;">Join CanopyShield</a>
    </div>

    <div style="color: #323232; font-size: 14px; line-height: 20px;">
      <p>If you have any questions or need help, reply to this email and our support team will assist you.</p>
    </div>
  </div>
</div>
`;

export const forgotPassword = (data: { otp: string; duration: number }) => `
<div id="email-info" style="font-family: 'Inter', sans-serif; color: #323232;">
  <img src="https://via.placeholder.com/150?text=CanopyShield" alt="CanopyShield Logo" style="max-width: 150px;" />
  <div style="padding: 30px 0px; border-bottom: 2px solid #EDF2F7;"></div>
  <div>
    <h4 style="font-weight: 700; font-size: 20px; line-height: 26px; letter-spacing: -0.04em; color: #323232; padding-bottom: 24px;">
      Password Reset Request
    </h4>
    <p style="font-weight: 400; font-size: 16px; line-height: 24px; color: #425466;">
      Your password reset code is <b>${data.otp}</b>
    </p>
    <p style="font-family: 'Inter'; font-weight: 400; font-size: 16px; line-height: 24px; color: #425466;">
        The OTP expires in <span><b>${data.duration} minutes</b></span>
    </p>
    <p style="font-size: 14px; color: #6B7280;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>
`;

export const resendOtp = (data: { otp: string; duration: number }) => `
<div id="email-info" style="font-family: 'Inter', sans-serif; color: #323232;">
  <img src="https://via.placeholder.com/150?text=CanopyShield" alt="CanopyShield Logo" style="max-width: 150px;" />
  <div style="padding: 30px 0px; border-bottom: 2px solid #EDF2F7;"></div>
  <div>
    <h4 style="font-weight: 700; font-size: 20px; line-height: 26px; letter-spacing: -0.04em; color: #323232; padding-bottom: 24px;">
      Your OTP Code
    </h4>
    <p style="font-weight: 400; font-size: 16px; line-height: 24px; color: #425466;">
      Your new OTP code is <b>${data.otp}</b>
    </p>
    <p style="font-family: 'Inter'; font-weight: 400; font-size: 16px; line-height: 24px; color: #425466;">
        The OTP expires in <span><b>${data.duration} minutes</b></span>
    </p>
    <p style="font-size: 14px; color: #6B7280;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>
`;

