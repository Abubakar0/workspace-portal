import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog } from '../../shared/models/audit-log.model';
import { Team } from '../../shared/models/team.model';
import { User } from '../../shared/models/user.model';
import { Vps } from '../../shared/models/vps.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  getEmployees(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/admin/employees`);
  }

  createEmployee(employee: Partial<User> & { password: string }): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/admin/employees`, employee);
  }

  updateEmployee(id: number, employee: Partial<User> & { password?: string }): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/admin/employees/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/employees/${id}`);
  }

  createTeam(team: Partial<Team>): Observable<Team> {
    return this.http.post<Team>(`${environment.apiUrl}/admin/teams`, team);
  }

  updateTeam(id: number, team: Partial<Team>): Observable<Team> {
    return this.http.put<Team>(`${environment.apiUrl}/admin/teams/${id}`, team);
  }

  deleteTeam(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/teams/${id}`);
  }

  createVps(vps: Partial<Vps>): Observable<Vps> {
    return this.http.post<Vps>(`${environment.apiUrl}/admin/vps`, vps);
  }

  updateVps(id: number, vps: Partial<Vps>): Observable<Vps> {
    return this.http.put<Vps>(`${environment.apiUrl}/admin/vps/${id}`, vps);
  }

  deleteVps(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/vps/${id}`);
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${environment.apiUrl}/admin/audit-logs`);
  }
}
