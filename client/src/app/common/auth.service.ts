import { Injectable, signal, computed } from '@angular/core';
import { ILoginDetail, RoleType } from '../login-detail/logindetail.model';
import { IStudent } from '../student/student.model';

export interface IAuthState {
  role: RoleType | null;
  name: string | null;
  username: string | null;
  studentId: number | null;
  schoolId: number | null;
  standardId: number | null;
}

const EMPTY_STATE: IAuthState = {
  role: null,
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
    this._user.set({
      role: loginDetail.role,
      name: loginDetail.name,
      username: loginDetail.username,
      studentId: student?.Id ?? null,
      schoolId: student?.school ?? null,
      standardId: student?.standard ?? null,
    });
    // Persist role + name for page refreshes
    localStorage.setItem('role', loginDetail.role);
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
    if (role && name) {
      this._user.set({
        role,
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
    localStorage.removeItem('userName');
    localStorage.removeItem('schoolId');
    localStorage.removeItem('standardId');
    localStorage.removeItem('studentId');
  }
}
