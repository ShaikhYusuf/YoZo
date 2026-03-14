import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IProgress } from './progress.model';

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private apiUrl = 'http://localhost:3000/v1';
  schoolId: number = 0;
  standardId: number = 0;
  studentId: number = 0;
  subjectId: number = 0;
  lessonId: number = 0;
  data: IProgress[] = [];

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getAllSchool(inSchoolId: number): Observable<IProgress[]> {
    return this.http.get<IProgress[]>(
      `${this.apiUrl}/progress/school/${inSchoolId}`,
      {
        headers: this.headers,
      }
    );
  }

  getAllStandard(
    inSchoolId: number,
    inStandardId: number
  ): Observable<IProgress[]> {
    this.schoolId = inSchoolId;
    this.standardId = inStandardId;
    return this.http.get<IProgress[]>(
      `${this.apiUrl}/progress/school/${inSchoolId}/standard/${inStandardId}`,
      {
        headers: this.headers,
      }
    );
  }

  getAllStudent(
    inSchoolId: number,
    inStandardId: number,
    inStudentId: number
  ): Observable<IProgress[]> {
    this.schoolId = inSchoolId;
    this.standardId = inStandardId;
    this.studentId = inStudentId;
    return this.http.get<IProgress[]>(
      `${this.apiUrl}/progress/school/${inSchoolId}/standard/${inStandardId}/student/${inStudentId}`,
      {
        headers: this.headers,
      }
    );
  }

  get(inProgressId: number): Observable<IProgress> {
    return this.http.get<IProgress>(`${this.apiUrl}/progress/${inProgressId}`, {
      headers: this.headers,
    });
  }

  add(inProgress: IProgress): Observable<IProgress> {
    return this.http.post<IProgress>(`${this.apiUrl}/progress`, inProgress, {
      headers: this.headers,
    });
  }

  edit(inProgress: IProgress): Observable<IProgress> {
    return this.http.put<IProgress>(
      `${this.apiUrl}/progress/${inProgress.Id}`,
      inProgress,
      {
        headers: this.headers,
      }
    );
  }

  delete(inProgressId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/progress/${inProgressId}`, {
      headers: this.headers,
    });
  }
}
