import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      )
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        path: 'vps',
        loadComponent: () =>
          import('./modules/vps/pages/vps-list/vps-list.component').then(
            (m) => m.VpsListComponent
          )
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./modules/teams/pages/teams/teams.component').then(
            (m) => m.TeamsComponent
          )
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./modules/settings/pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          )
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./modules/admin/pages/admin-console/admin-console.component').then(
            (m) => m.AdminConsoleComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
