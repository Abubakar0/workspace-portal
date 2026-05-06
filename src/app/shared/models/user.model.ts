export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  team: string;
  marketplace: string;
  status: 'active' | 'inactive';
  shift: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
