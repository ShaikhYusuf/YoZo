import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ILessonSection } from './lessonsection.model';

@Injectable({
  providedIn: 'root',
})
export class LessonSectionService {
  private apiUrl = 'http://localhost:3000/v1';
  lessonId: number = 0;
  data: ILessonSection[] = [];

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getAll(
    inSubjectId: number,
    inLessonId: number
  ): Observable<ILessonSection[]> {
    this.lessonId = inSubjectId;
    return this.http.get<ILessonSection[]>(
      `${this.apiUrl}/lessonsection/subject/${inSubjectId}/lesson/${inLessonId}`,
      {
        headers: this.headers,
      }
    );
  }

  get(inLessonSectionId: number): Observable<ILessonSection> {
    return this.http.get<ILessonSection>(
      `${this.apiUrl}/lessonsection/${inLessonSectionId}`,
      {
        headers: this.headers,
      }
    );
  }

  add(inLessonSection: ILessonSection): Observable<ILessonSection> {
    return this.http.post<ILessonSection>(
      `${this.apiUrl}/lessonsection`,
      inLessonSection,
      {
        headers: this.headers,
      }
    );
  }

  edit(inLessonSection: ILessonSection): Observable<ILessonSection> {
    return this.http.put<ILessonSection>(
      `${this.apiUrl}/lessonsection/${inLessonSection.Id}`,
      inLessonSection,
      {
        headers: this.headers,
      }
    );
  }

  delete(inLessonSectionId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/lessonsection/${inLessonSectionId}`,
      {
        headers: this.headers,
      }
    );
  }
}
