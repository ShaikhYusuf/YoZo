import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ILesson } from './lesson.model';

@Injectable({
  providedIn: 'root',
})
export class LessonService {
  private apiUrl = 'http://localhost:3000/v1';
  subjectId: number = 0;
  data: ILesson[] = [];

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getAll(inSubjectId: number): Observable<ILesson[]> {
    this.subjectId = inSubjectId;
    return this.http.get<ILesson[]>(
      `${this.apiUrl}/lesson/subject/${inSubjectId}`,
      {
        headers: this.headers,
      }
    );
  }

  get(inLessonId: number): Observable<ILesson> {
    return this.http.get<ILesson>(`${this.apiUrl}/lesson/${inLessonId}`, {
      headers: this.headers,
    });
  }

  add(inLesson: ILesson): Observable<ILesson> {
    return this.http.post<ILesson>(`${this.apiUrl}/lesson`, inLesson, {
      headers: this.headers,
    });
  }

  edit(inLesson: ILesson): Observable<ILesson> {
    return this.http.put<ILesson>(
      `${this.apiUrl}/lesson/${inLesson.Id}`,
      inLesson,
      {
        headers: this.headers,
      }
    );
  }

  delete(inLessonId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lesson/${inLessonId}`, {
      headers: this.headers,
    });
  }
}
