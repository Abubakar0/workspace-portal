import bcrypt from 'bcryptjs';

export type Role = 'admin' | 'manager' | 'employee';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: Role;
  team: string;
  marketplace: string;
  status: 'active' | 'inactive';
  shift: string;
  passwordHash: string;
}

export interface VpsRecord {
  id: number;
  name: string;
  team: string;
  assignedEmployee: string;
  status: 'online' | 'offline';
  connectionId: string;
  marketplace: string;
  region: string;
}

export interface TeamRecord {
  id: number;
  name: string;
  marketplace: string;
  lead: string;
  assigned: number;
  members: number;
}

export interface AuditLogRecord {
  id: number;
  actor: string;
  action: string;
  entity: string;
  createdAt: string;
}

export const users: UserRecord[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@trendwave.com',
    role: 'admin',
    team: 'Operations',
    marketplace: 'All',
    status: 'active',
    shift: 'Day',
    passwordHash: bcrypt.hashSync('password123', 10)
  },
  {
    id: 2,
    name: 'Ali Khan',
    email: 'ali@trendwave.com',
    role: 'employee',
    team: 'Amazon',
    marketplace: 'Amazon',
    status: 'active',
    shift: 'Evening',
    passwordHash: bcrypt.hashSync('password123', 10)
  },
  {
    id: 3,
    name: 'Usman',
    email: 'usman@trendwave.com',
    role: 'employee',
    team: 'eBay',
    marketplace: 'eBay',
    status: 'active',
    shift: 'Night',
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
    connectionId: 'a-2193',
    marketplace: 'Amazon',
    region: 'US'
  },
  {
    id: 2,
    name: 'eBay-UK-04',
    team: 'eBay',
    assignedEmployee: 'Usman',
    status: 'offline',
    connectionId: 'e-9291',
    marketplace: 'eBay',
    region: 'UK'
  },
  {
    id: 3,
    name: 'Dev-Lab-02',
    team: 'Development',
    assignedEmployee: 'Admin User',
    status: 'online',
    connectionId: 'd-4420',
    marketplace: 'Internal',
    region: 'US'
  }
];

export const teams: TeamRecord[] = [
  { id: 1, name: 'Amazon', marketplace: 'Amazon', lead: 'Ali Khan', assigned: 12, members: 8 },
  { id: 2, name: 'eBay', marketplace: 'eBay', lead: 'Usman', assigned: 8, members: 5 },
  { id: 3, name: 'Development', marketplace: 'Internal', lead: 'Admin User', assigned: 5, members: 4 }
];

export const auditLogs: AuditLogRecord[] = [
  {
    id: 1,
    actor: 'Admin User',
    action: 'Seeded portal data',
    entity: 'System',
    createdAt: new Date().toISOString()
  }
];
