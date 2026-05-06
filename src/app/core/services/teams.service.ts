import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Team } from '../../shared/models/team.model';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Team[]> {
    return this.http.get<Team[]>(`${environment.apiUrl}/teams`);
  }
}
