import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IGamification } from './gamification.model';

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private apiUrl = 'http://localhost:3000/v1/gamification';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token',
  });

  constructor(private http: HttpClient) {}

  getStudentProfile(studentId: number): Observable<IGamification> {
    return this.http.get<IGamification>(`${this.apiUrl}/student/${studentId}`, {
      headers: this.headers
    });
  }
}
