export type RoleType = 'admin' | 'principal' | 'teacher' | 'student' | 'parent';
export const roleList = [
  'admin',
  'principal',
  'teacher',
  'student',
  'parent',
] as const;
export interface ILoginDetail {
  Id?: number;
  name: string;
  adhaar: string;
  password: string;
  role: RoleType;
}
