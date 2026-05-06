export interface Vps {
  id: number;
  name: string;
  team: string;
  assignedEmployee: string;
  status: 'online' | 'offline';
  connectionId: string;
  marketplace: string;
  region: string;
}
