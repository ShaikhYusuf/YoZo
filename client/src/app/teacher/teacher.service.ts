import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ITeacher } from './teacher.model';

@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  private apiUrl = 'http://localhost:3000/v1';
  schoolId: number = 0;
  standardId: number = 0;
  data: ITeacher[] = [];

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getAll(inSchoolId: number, inStandardId: number): Observable<ITeacher[]> {
    this.schoolId = inSchoolId;
    this.standardId = inStandardId;
    return this.http.get<ITeacher[]>(
      `${this.apiUrl}/teacher/school/${inSchoolId}/standard/${inStandardId}`,
      {
        headers: this.headers,
      }
    );
  }

  getByAdhaar(inTeacherAdhaar: string): Observable<ITeacher> {
    return this.http.get<ITeacher>(
      `${this.apiUrl}/teacher/adhaar/${inTeacherAdhaar}`,
      {
        headers: this.headers,
      }
    );
  }

  get(inTeacherId: number): Observable<ITeacher> {
    return this.http.get<ITeacher>(`${this.apiUrl}/teacher/${inTeacherId}`, {
      headers: this.headers,
    });
  }

  add(inTeacher: ITeacher): Observable<ITeacher> {
    return this.http.post<ITeacher>(`${this.apiUrl}/teacher`, inTeacher, {
      headers: this.headers,
    });
  }

  edit(inTeacher: ITeacher): Observable<ITeacher> {
    return this.http.put<ITeacher>(
      `${this.apiUrl}/teacher/${inTeacher.Id}`,
      inTeacher,
      {
        headers: this.headers,
      }
    );
  }

  delete(inTeacherId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teacher/${inTeacherId}`, {
      headers: this.headers,
    });
  }
}
