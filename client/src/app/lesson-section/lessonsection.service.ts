import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ILessonSection } from './lessonsection.model';
import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root',
})
export class LessonSectionService {
  private apiUrl = 'http://localhost:5050/v1';
  lessonId: number = 0;
  data: ILessonSection[] = [];

  constructor(
    private http: HttpClient,
    private apiHeaders: ApiHeadersService
  ) {}

  getAll(
    inSubjectId: number,
    inLessonId: number
  ): Observable<ILessonSection[]> {
    this.lessonId = inSubjectId;
    return this.http.get<ILessonSection[]>(
      `${this.apiUrl}/lessonsection/subject/${inSubjectId}/lesson/${inLessonId}?t=${new Date().getTime()}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  get(inLessonSectionId: number): Observable<ILessonSection> {
    return this.http.get<ILessonSection>(
      `${this.apiUrl}/lessonsection/${inLessonSectionId}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  add(inLessonSection: ILessonSection): Observable<ILessonSection> {
    return this.http.post<ILessonSection>(
      `${this.apiUrl}/lessonsection`,
      inLessonSection,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  edit(inLessonSection: ILessonSection): Observable<ILessonSection> {
    return this.http.put<ILessonSection>(
      `${this.apiUrl}/lessonsection/${inLessonSection.Id}`,
      inLessonSection,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  delete(inLessonSectionId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/lessonsection/${inLessonSectionId}`,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }
}
