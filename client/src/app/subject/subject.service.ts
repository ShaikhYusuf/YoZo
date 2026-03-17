import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ISubject } from './subject.model';

@Injectable({
  providedIn: 'root',
})
export class SubjectService {
  private apiUrl = 'http://localhost:3000/v1';
  standardId: number = 0;
  data: ISubject[] = [];

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getAll(inStandardId: number): Observable<ISubject[]> {
    this.standardId = inStandardId;
    return this.http.get<ISubject[]>(
      `${this.apiUrl}/subject/standard/${inStandardId}`,
      {
        headers: this.headers,
      }
    );
  }

  get(inSubjectId: number): Observable<ISubject> {
    return this.http.get<ISubject>(`${this.apiUrl}/subject/${inSubjectId}`, {
      headers: this.headers,
    });
  }

  add(inSubject: ISubject): Observable<ISubject> {
    return this.http.post<ISubject>(`${this.apiUrl}/subject`, inSubject, {
      headers: this.headers,
    });
  }

  edit(inSubject: ISubject): Observable<ISubject> {
    return this.http.put<ISubject>(
      `${this.apiUrl}/subject/${inSubject.Id}`,
      inSubject,
      {
        headers: this.headers,
      }
    );
  }

  delete(inSubjectId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subject/${inSubjectId}`, {
      headers: this.headers,
    });
  }
}
