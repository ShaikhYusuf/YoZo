import { RoleType, PermissionType } from '../../login-detail/logindetail.model';

export interface SidebarItem {
  label: string;
  route: string;
  icon?: string;
  allowedRoles: RoleType[];
  requiredPermissions?: PermissionType[];
}

export const SIDEBAR_CONFIG: SidebarItem[] = [
  {
    label: 'Dashboard',
    route: '/school-dashboard',
    icon: 'fa-table-columns',
    allowedRoles: ['admin', 'principal', 'teacher'],
    requiredPermissions: ['VIEW_DASHBOARD']
  },
  {
    label: 'Dashboard',
    route: '/student-dashboard',
    icon: 'fa-table-columns',
    allowedRoles: ['student', 'parent']
  },
  {
    label: 'Colleges',
    route: '/school',
    icon: 'fa-building-columns',
    allowedRoles: ['admin'],
    requiredPermissions: ['EDIT_COLLEGES']
  },
  {
    label: 'Users',
    route: '/login-details',
    icon: 'fa-users',
    allowedRoles: ['admin', 'principal'],
    requiredPermissions: ['VIEW_USERS']
  },
  {
    label: 'Profile',
    route: '/profile',
    icon: 'fa-id-badge',
    allowedRoles: ['admin', 'principal', 'teacher', 'student', 'parent']
  },
  {
    label: 'Voice Settings',
    route: '/voice-settings',
    icon: 'fa-microphone-lines',
    allowedRoles: ['admin', 'principal', 'teacher', 'student', 'parent'],
    requiredPermissions: ['MANAGE_SETTINGS']
  }
];
