import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ISchoolStandard } from './schoolstandard.model';

@Injectable({
  providedIn: 'root',
})
export class SchoolStandardService {
  private apiUrl = 'http://localhost:3000/v1';
  schoolId: number = 0;
  standardId: number = 0;
  data: ISchoolStandard[] = [];

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getAll(inSchoolId: number): Observable<ISchoolStandard[]> {
    this.schoolId = inSchoolId;
    return this.http.get<ISchoolStandard[]>(
      `${this.apiUrl}/schoolstandard/school/${inSchoolId}`,
      {
        headers: this.headers,
      }
    );
  }

  get(inSchoolStandardId: number): Observable<ISchoolStandard> {
    return this.http.get<ISchoolStandard>(
      `${this.apiUrl}/schoolstandard/${inSchoolStandardId}`,
      {
        headers: this.headers,
      }
    );
  }

  add(inSchoolStandard: ISchoolStandard): Observable<ISchoolStandard> {
    return this.http.post<ISchoolStandard>(
      `${this.apiUrl}/schoolstandard`,
      inSchoolStandard,
      {
        headers: this.headers,
      }
    );
  }

  delete(inSchoolStandardId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/schoolstandard/${inSchoolStandardId}`,
      {
        headers: this.headers,
      }
    );
  }
}
