import { Injectable } from '@angular/core';
import { sha256 } from 'crypto-hash';
import { LoginDetailService } from '../login-detail/logindetail.service';
import { ILoginDetail } from '../login-detail/logindetail.model';
import { lastValueFrom, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StudentService } from '../student/student.service';
import { IStudent } from '../student/student.model';

import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = 'http://localhost:5050/v1';
  userInfo: ILoginDetail | null = null;
  constructor(
    private http: HttpClient,
    private studentService: StudentService,
    private apiHeaders: ApiHeadersService
  ) {}


  validate(inUsername: string, inPassword: string): Observable<ILoginDetail> {
    return this.http.post<ILoginDetail>(
      `${this.apiUrl}/logindetail/validate`,
      {
        username: inUsername,
        password: inPassword,
      },
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  getByUsername(username: string): Observable<IStudent> {
    return this.studentService.getByUsername(username);
  }
}
