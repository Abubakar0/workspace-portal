import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()?.role === 'admin') {
    return true;
  }

  if (!localStorage.getItem('token')) {
    router.navigate(['/login']);
    return false;
  }

  return auth.loadProfile().pipe(
    map((user) => {
      if (user.role === 'admin') {
        return true;
      }

      return router.createUrlTree(['/dashboard']);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
