import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IGamification } from './gamification.model';

import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private apiUrl = 'http://localhost:5050/v1/gamification';

  constructor(
    private http: HttpClient,
    private apiHeaders: ApiHeadersService
  ) {}

  getStudentProfile(studentId: number): Observable<IGamification> {
    return this.http.get<IGamification>(`${this.apiUrl}/student/${studentId}`, {
      headers: this.apiHeaders.headers
    });
  }
}
