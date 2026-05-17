import getTemplate from './index';

type EmailMessageType = 'userValidationOTP' | 'userInvitation';

export const commonTemplate = (messageType: EmailMessageType, data: any): string => {
  return getTemplate(messageType, data);
};
