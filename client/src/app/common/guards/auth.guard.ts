import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Attempt to restore user state from storage if it hasn't been already
  if (!authService.user().role) {
    authService.restoreFromStorage();
  }

  if (authService.isLoggedIn()) {
    return true;
  }

  // Not logged in, redirect to login page
  return router.createUrlTree(['/login']);
};
