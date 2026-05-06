import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BackendSettings {
  companyName: string;
  apiUrl: string;
  guacamoleBaseUrl: string;
  auth: string;
  storage: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  getSettings(): Observable<BackendSettings> {
    return this.http.get<BackendSettings>(`${environment.apiUrl}/settings`);
  }
}
