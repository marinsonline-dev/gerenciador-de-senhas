export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created: string; // ISO string
  last: string;    // ISO string
  ownerId: string;
  createdBy?: string;
  adminId?: string;
}

export interface Credential {
  id: string;
  site: string;
  url: string;
  username: string;
  password: string; // encrypted
  createdAt: string; // ISO string
  ownerId: string;
  userId: string;
  createdBy: string;
}
