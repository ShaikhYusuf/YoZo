import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../common/auth.service';
import { SIDEBAR_CONFIG } from './sidebar.config';
import { RoleType } from '../../login-detail/logindetail.model';

@Component({
  selector: 'ui-sidebar',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Observable for current URL to determine active state
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isCollapsed = false;

  navItems = computed(() => {
    // Determine current role and permissions from AuthService or fallback to localStorage
    const user = this.authService.user();
    let role = user.role;
    let permissions = user.permissions;

    if (!role) {
      role = localStorage.getItem('role') as RoleType;
      try {
        permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
      } catch {
        permissions = [];
      }
    }

    if (!role) return [];
    
    // Filter configuration by allowed roles AND required permissions
    return SIDEBAR_CONFIG.filter(item => {
      const hasRole = item.allowedRoles.includes(role as RoleType);
      
      let hasPermission = true;
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        // User must have ALL required permissions (or 'ACCESS_ALL' override)
        const hasAccessAll = permissions.includes('ACCESS_ALL');
        hasPermission = hasAccessAll || item.requiredPermissions.every(p => permissions.includes(p));
      }

      return hasRole && hasPermission;
    });
  });

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  isActive(route: string): boolean {
    const url = this.currentUrl();
    if (!url) return false;
    return url.startsWith(route);
  }

  logout() {
    this.authService.clearUser();
    this.router.navigate(['/']);
  }
}
