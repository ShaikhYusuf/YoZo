import { Injectable, signal, computed } from '@angular/core';
import { ILoginDetail, RoleType, PermissionType } from '../login-detail/logindetail.model';
import { IStudent } from '../student/student.model';

export interface IAuthState {
  role: RoleType | null;
  permissions: PermissionType[];
  name: string | null;
  username: string | null;
  studentId: number | null;
  schoolId: number | null;
  standardId: number | null;
}

const ROLE_PERMISSIONS: Record<RoleType, PermissionType[]> = {
  admin: ['VIEW_USERS', 'EDIT_COLLEGES', 'VIEW_DASHBOARD', 'MANAGE_SETTINGS', 'ACCESS_ALL'],
  principal: ['VIEW_USERS', 'VIEW_DASHBOARD', 'MANAGE_SETTINGS'],
  teacher: ['VIEW_DASHBOARD', 'MANAGE_SETTINGS'],
  student: ['VIEW_DASHBOARD', 'MANAGE_SETTINGS'],
  parent: ['VIEW_DASHBOARD', 'MANAGE_SETTINGS']
};

const EMPTY_STATE: IAuthState = {
  role: null,
  permissions: [],
  name: null,
  username: null,
  studentId: null,
  schoolId: null,
  standardId: null,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<IAuthState>({ ...EMPTY_STATE });

  /** Read-only signal for the current authenticated user state. */
  readonly user = this._user.asReadonly();

  /** Convenience: whether anyone is logged in. */
  readonly isLoggedIn = computed(() => this._user().role !== null);

  /**
   * Call after a successful /logindetail/validate response.
   * Pass the optional student object for student-role logins.
   */
  setUser(loginDetail: ILoginDetail, student?: IStudent): void {
    const perms = (loginDetail.permissions && loginDetail.permissions.length > 0)
      ? loginDetail.permissions
      : ROLE_PERMISSIONS[loginDetail.role] || [];
    this._user.set({
      role: loginDetail.role,
      permissions: perms,
      name: loginDetail.name,
      username: loginDetail.username,
      studentId: student?.Id ?? null,
      schoolId: student?.school ?? null,
      standardId: student?.standard ?? null,
    });
    // Persist role + name for page refreshes
    localStorage.setItem('role', loginDetail.role);
    localStorage.setItem('permissions', JSON.stringify(perms));
    localStorage.setItem('userName', loginDetail.name);
    if (student) {
      localStorage.setItem('schoolId', String(student.school ?? ''));
      localStorage.setItem('standardId', String(student.standard ?? ''));
      localStorage.setItem('studentId', String(student.Id ?? ''));
    }
  }

  /** Restore state from localStorage (call on app init if needed). */
  restoreFromStorage(): void {
    const role = localStorage.getItem('role') as RoleType | null;
    const name = localStorage.getItem('userName');
    let permissions: PermissionType[] = [];
    try {
      permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
    } catch {}

    if (role && name) {
      if (permissions.length === 0) {
        permissions = ROLE_PERMISSIONS[role] || [];
        localStorage.setItem('permissions', JSON.stringify(permissions));
      }

      this._user.set({
        role,
        permissions,
        name,
        username: null,
        studentId: Number(localStorage.getItem('studentId')) || null,
        schoolId: Number(localStorage.getItem('schoolId')) || null,
        standardId: Number(localStorage.getItem('standardId')) || null,
      });
    }
  }

  /** Clear auth state and localStorage on logout. */
  clearUser(): void {
    this._user.set({ ...EMPTY_STATE });
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    localStorage.removeItem('userName');
    localStorage.removeItem('schoolId');
    localStorage.removeItem('standardId');
    localStorage.removeItem('studentId');
  }
}
