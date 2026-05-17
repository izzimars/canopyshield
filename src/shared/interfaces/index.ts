export interface JwtSignature {
  issuer: string;
  subject: string;
  audience: string;
  expiresIn?: string | number;
}

export interface SignedData {
  id: string;
  user_id: string;
  username?: string;
  email?: string;
  verified?: boolean;
  user_type?: string;
  type?: string;
}