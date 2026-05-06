import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vps } from '../../shared/models/vps.model';

@Injectable({
  providedIn: 'root'
})
export class VpsService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Vps[]> {
    return this.http.get<Vps[]>(`${environment.apiUrl}/vps`);
  }

  launch(vpsId: number): Observable<{ workspaceUrl: string; connectionId: string }> {
    return this.http.post<{ workspaceUrl: string; connectionId: string }>(
      `${environment.apiUrl}/vps/${vpsId}/launch`,
      {}
    );
  }
}
