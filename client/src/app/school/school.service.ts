import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ISchool } from './school.model';
import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root',
})
export class SchoolService {
  private apiUrl = 'http://localhost:5050/v1';

  data: ISchool[] = [];

  constructor(
    private http: HttpClient,
    private apiHeaders: ApiHeadersService
  ) {}

  getAll(): Observable<ISchool[]> {
    return this.http.get<ISchool[]>(`${this.apiUrl}/school`, {
      headers: this.apiHeaders.headers,
    });
  }

  get(inSchoolId: number): Observable<ISchool> {
    return this.http.get<ISchool>(`${this.apiUrl}/school/${inSchoolId}`, {
      headers: this.apiHeaders.headers,
    });
  }

  add(inSchool: ISchool): Observable<ISchool> {
    return this.http.post<ISchool>(`${this.apiUrl}/school`, inSchool, {
      headers: this.apiHeaders.headers,
    });
  }

  edit(inSchool: ISchool): Observable<ISchool> {
    return this.http.put<ISchool>(
      `${this.apiUrl}/school/${inSchool.Id}`,
      inSchool,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  delete(inSchoolId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/school/${inSchoolId}`, {
      headers: this.apiHeaders.headers,
    });
  }
}
