import { Request } from 'express';

export interface UserPayload {
  id: string;
  username: string;
  role: 'admin' | 'user';
  displayName: string;
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}
