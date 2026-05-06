export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  team: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
