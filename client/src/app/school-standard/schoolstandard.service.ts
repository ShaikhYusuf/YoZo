import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ISchoolStandard } from './schoolstandard.model';
import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root',
})
export class SchoolStandardService {
  private apiUrl = 'http://localhost:5050/v1';
  schoolId: number = 0;
  standardId: number = 0;
  data: ISchoolStandard[] = [];

  constructor(
    private http: HttpClient,
    private apiHeaders: ApiHeadersService
  ) {}

  getAll(inSchoolId: number): Observable<ISchoolStandard[]> {
    this.schoolId = inSchoolId;
    return this.http.get<ISchoolStandard[]>(
      `${this.apiUrl}/schoolstandard/school/${inSchoolId}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  get(inSchoolStandardId: number): Observable<ISchoolStandard> {
    return this.http.get<ISchoolStandard>(
      `${this.apiUrl}/schoolstandard/${inSchoolStandardId}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  add(inSchoolStandard: ISchoolStandard): Observable<ISchoolStandard> {
    return this.http.post<ISchoolStandard>(
      `${this.apiUrl}/schoolstandard`,
      inSchoolStandard,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  delete(inSchoolStandardId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/schoolstandard/${inSchoolStandardId}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }
}
