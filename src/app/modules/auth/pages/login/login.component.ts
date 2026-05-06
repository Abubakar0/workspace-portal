import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private auth: AuthService) {}

  submit(): void {
    this.errorMessage = '';
    this.loading = true;

    this.auth.login(this.email, this.password).subscribe({
      error: (error) => {
        this.errorMessage = error.error?.message || 'Login failed';
        this.loading = false;
      }
    });
  }
}
