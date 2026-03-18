import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IStudent } from './student.model';
import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private apiUrl = 'http://localhost:5050/v1';
  schoolId: number = 0;
  standardId: number = 0;
  data: IStudent[] = [];

  constructor(
    private http: HttpClient,
    private apiHeaders: ApiHeadersService
  ) {}

  getAll(inSchoolId: number, inStandardId: number): Observable<IStudent[]> {
    this.schoolId = inSchoolId;
    this.standardId = inStandardId;
    return this.http.get<IStudent[]>(
      `${this.apiUrl}/student/school/${inSchoolId}/standard/${inStandardId}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  getByUsername(inUsername: string): Observable<IStudent> {
    return this.http.get<IStudent>(
      `${this.apiUrl}/student/username/${inUsername}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  get(inStudentId: number): Observable<IStudent> {
    return this.http.get<IStudent>(`${this.apiUrl}/student/${inStudentId}`, {
      headers: this.apiHeaders.headers,
    });
  }

  add(inStudent: IStudent): Observable<IStudent> {
    return this.http.post<IStudent>(`${this.apiUrl}/student`, inStudent, {
      headers: this.apiHeaders.headers,
    });
  }

  edit(inStudent: IStudent): Observable<IStudent> {
    return this.http.put<IStudent>(
      `${this.apiUrl}/student/${inStudent.Id}`,
      inStudent,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  delete(inStudentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/student/${inStudentId}`, {
      headers: this.apiHeaders.headers,
    });
  }
}
