import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth.service';
import { RoleType, PermissionType } from '../../login-detail/logindetail.model';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.user();
  
  // Guard requires an active user session (AuthGuard must run first)
  if (!user.role) {
    return router.createUrlTree(['/login']);
  }

  const routeRoles = route.data['roles'] as RoleType[] | undefined;
  const routePermissions = route.data['permissions'] as PermissionType[] | undefined;

  let hasRole = true;
  if (routeRoles && routeRoles.length > 0) {
    hasRole = routeRoles.includes(user.role);
  }

  let hasPermission = true;
  if (routePermissions && routePermissions.length > 0) {
    const userPermissions = user.permissions || [];
    const hasAccessAll = userPermissions.includes('ACCESS_ALL');
    hasPermission = hasAccessAll || routePermissions.every(p => userPermissions.includes(p));
  }

  if (hasRole && hasPermission) {
    return true;
  }

  // Unauthorized, fallback to their dashboard or home
  return router.createUrlTree(['/']);
};
