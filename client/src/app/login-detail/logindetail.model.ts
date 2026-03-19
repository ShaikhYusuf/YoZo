export type RoleType = 'admin' | 'principal' | 'teacher' | 'student' | 'parent';
export const roleList = [
  'admin',
  'principal',
  'teacher',
  'student',
  'parent',
] as const;

export type PermissionType = 'VIEW_USERS' | 'EDIT_COLLEGES' | 'VIEW_DASHBOARD' | 'MANAGE_SETTINGS' | 'ACCESS_ALL';

export interface ILoginDetail {
  Id?: number;
  name: string;
  username: string;
  password: string;
  role: RoleType;
  permissions?: PermissionType[];
}
