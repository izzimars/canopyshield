import { Request, Response, NextFunction } from 'express';

export type ExpressController = (req: Request, res: Response, next?: NextFunction) => any;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
interface RequestWithClaim extends Request {
  claim?: any;
  file?: any;
}

export interface AuthRequest extends Request {
  claim?: any;
  user?: {
    id: string;
    uuid: string;
    email: string;
    role: string;
    jti: string;
    is_verified?: boolean;
  };
}

export type UserProfile = {
  id: string;
  email: string;
  points: number;
  role: string;
  schoolId?: string;
  badges: Array<{
    type: string;
    awarded_at: string;
  }>;
  alertPreferences?: {
    risk_threshold: number;
    channels: string[];
    frequency: string;
  }
};

export type fnRequest = (req: RequestWithClaim, res: Response) => Promise<any>;

export default RequestWithClaim;
