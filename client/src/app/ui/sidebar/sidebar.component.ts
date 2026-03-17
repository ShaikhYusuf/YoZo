import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'ui-sidebar',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private router = inject(Router);

  // Observable for current URL to determine active state
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isCollapsed = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  // Define the core navigation links
  navItems = [
    { label: 'Dashboard', icon: 'fa-table-columns', route: '/school-dashboard' },
    { label: 'Colleges', icon: 'fa-building-columns', route: '/school' },
    { label: 'Users', icon: 'fa-users', route: '/login-details' },
    { label: 'Profile', icon: 'fa-id-badge', route: '/profile' },
    { label: 'Voice Settings', icon: 'fa-microphone-lines', route: '/voice-settings' }
  ];

  isActive(route: string): boolean {
    const url = this.currentUrl();
    if (!url) return false;
    // Simple active check: if the URL starts with the route, it's active.
    // E.g., /school-dashboard matches /school-dashboard
    return url.startsWith(route);
  }

  logout() {
    // Basic logout clears token and routes to login
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/']);
  }
}
