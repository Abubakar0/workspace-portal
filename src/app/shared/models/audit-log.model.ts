export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  entity: string;
  createdAt: string;
}
