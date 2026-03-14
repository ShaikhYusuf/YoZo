import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ISchool } from './school.model';

@Injectable({
  providedIn: 'root',
})
export class SchoolService {
  private apiUrl = 'http://localhost:3000/v1';

  data: ISchool[] = [];

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getAll(): Observable<ISchool[]> {
    return this.http.get<ISchool[]>(`${this.apiUrl}/school`, {
      headers: this.headers,
    });
  }

  get(inSchoolId: number): Observable<ISchool> {
    return this.http.get<ISchool>(`${this.apiUrl}/school/${inSchoolId}`, {
      headers: this.headers,
    });
  }

  add(inSchool: ISchool): Observable<ISchool> {
    return this.http.post<ISchool>(`${this.apiUrl}/school`, inSchool, {
      headers: this.headers,
    });
  }

  edit(inSchool: ISchool): Observable<ISchool> {
    return this.http.put<ISchool>(
      `${this.apiUrl}/school/${inSchool.Id}`,
      inSchool,
      {
        headers: this.headers,
      }
    );
  }

  delete(inSchoolId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/school/${inSchoolId}`, {
      headers: this.headers,
    });
  }
}
