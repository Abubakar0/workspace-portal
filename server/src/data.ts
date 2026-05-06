import bcrypt from 'bcryptjs';

export type Role = 'admin' | 'manager' | 'employee';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: Role;
  team: string;
  passwordHash: string;
}

export interface VpsRecord {
  id: number;
  name: string;
  team: string;
  assignedEmployee: string;
  status: 'online' | 'offline';
  connectionId: string;
}

export const users: UserRecord[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@trendwave.com',
    role: 'admin',
    team: 'Operations',
    passwordHash: bcrypt.hashSync('password123', 10)
  },
  {
    id: 2,
    name: 'Ali Khan',
    email: 'ali@trendwave.com',
    role: 'employee',
    team: 'Amazon',
    passwordHash: bcrypt.hashSync('password123', 10)
  },
  {
    id: 3,
    name: 'Usman',
    email: 'usman@trendwave.com',
    role: 'employee',
    team: 'eBay',
    passwordHash: bcrypt.hashSync('password123', 10)
  }
];

export const vpsRecords: VpsRecord[] = [
  {
    id: 1,
    name: 'Amazon-US-01',
    team: 'Amazon',
    assignedEmployee: 'Ali Khan',
    status: 'online',
    connectionId: 'a-2193'
  },
  {
    id: 2,
    name: 'eBay-UK-04',
    team: 'eBay',
    assignedEmployee: 'Usman',
    status: 'offline',
    connectionId: 'e-9291'
  },
  {
    id: 3,
    name: 'Dev-Lab-02',
    team: 'Development',
    assignedEmployee: 'Admin User',
    status: 'online',
    connectionId: 'd-4420'
  }
];

export const teams = [
  { name: 'Amazon', assigned: 12, members: 8 },
  { name: 'eBay', assigned: 8, members: 5 },
  { name: 'Development', assigned: 5, members: 4 }
];
