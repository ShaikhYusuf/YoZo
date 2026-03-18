import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ISubject } from './subject.model';
import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root',
})
export class SubjectService {
  private apiUrl = 'http://localhost:5050/v1';
  standardId: number = 0;
  data: ISubject[] = [];

  constructor(
    private http: HttpClient,
    private apiHeaders: ApiHeadersService
  ) {}

  getAll(inStandardId: number): Observable<ISubject[]> {
    this.standardId = inStandardId;
    return this.http.get<ISubject[]>(
      `${this.apiUrl}/subject/standard/${inStandardId}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  get(inSubjectId: number): Observable<ISubject> {
    return this.http.get<ISubject>(`${this.apiUrl}/subject/${inSubjectId}`, {
      headers: this.apiHeaders.headers,
    });
  }

  add(inSubject: ISubject): Observable<ISubject> {
    return this.http.post<ISubject>(`${this.apiUrl}/subject`, inSubject, {
      headers: this.apiHeaders.headers,
    });
  }

  edit(inSubject: ISubject): Observable<ISubject> {
    return this.http.put<ISubject>(
      `${this.apiUrl}/subject/${inSubject.Id}`,
      inSubject,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  delete(inSubjectId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subject/${inSubjectId}`, {
      headers: this.apiHeaders.headers,
    });
  }
}
