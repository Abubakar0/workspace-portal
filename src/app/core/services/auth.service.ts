import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const token = localStorage.getItem('token');
    this.isAuthenticated.set(!!token);

    if (token) {
      this.loadProfile().subscribe({
        error: () => this.logout()
      });
    }
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          localStorage.setItem('token', response.token);
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
          this.router.navigate(['/dashboard']);
        })
      );
  }

  loadProfile() {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }
}
