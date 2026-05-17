import * as authEmail from './lib_template.auth';

const getTemplate = (type: string, data: any): string => {
  switch (type) {
    case 'userValidationOTP':
      return authEmail.userValidationOTP(data);
    case 'userInvitation':
      return authEmail.userInvitation(data);
    case 'forgotPassword':
      return authEmail.forgotPassword(data);
    case 'resendOtp':
        return authEmail.resendOtp(data);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
};

export default getTemplate;
