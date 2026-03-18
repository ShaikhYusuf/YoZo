import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ILesson } from './lesson.model';
import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root',
})
export class LessonService {
  private apiUrl = 'http://localhost:5050/v1';
  subjectId: number = 0;
  data: ILesson[] = [];

  constructor(
    private http: HttpClient,
    private apiHeaders: ApiHeadersService
  ) {}

  getAll(inSubjectId: number): Observable<ILesson[]> {
    this.subjectId = inSubjectId;
    return this.http.get<ILesson[]>(
      `${this.apiUrl}/lesson/subject/${inSubjectId}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  get(inLessonId: number): Observable<ILesson> {
    return this.http.get<ILesson>(`${this.apiUrl}/lesson/${inLessonId}`, {
      headers: this.apiHeaders.headers,
    });
  }

  add(inLesson: ILesson): Observable<ILesson> {
    return this.http.post<ILesson>(`${this.apiUrl}/lesson`, inLesson, {
      headers: this.apiHeaders.headers,
    });
  }

  edit(inLesson: ILesson): Observable<ILesson> {
    return this.http.put<ILesson>(
      `${this.apiUrl}/lesson/${inLesson.Id}`,
      inLesson,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  delete(inLessonId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lesson/${inLessonId}`, {
      headers: this.apiHeaders.headers,
    });
  }
}
