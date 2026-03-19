import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, timer, switchMap, filter, take, of, throwError } from 'rxjs';
import {
  IAiResponse,
  ILessonContent,
  ILessonHierarchy,
  IQuizSet,
  IScoreUpdate,
  IShortQuestionSet,
  ITrueFalseSet,
} from './lesson-ai.model';

@Injectable({
  providedIn: 'root',
})
export class AiLessonService {
  /** YoZo AI Service base URL (proxied through the Node server) */
  private readonly baseUrl = '/api/ai';

  constructor(private http: HttpClient) {}

  // ──── Helper: Poll Task ────────────────────────────────────────
  private pollTask<T>(taskId: string): Observable<T> {
    return timer(0, 2000).pipe(
      switchMap(() => this.http.get<IAiResponse<any>>(`${this.baseUrl}/tasks/${taskId}`)),
      map(res => res.data),
      filter(task => task.status === 'completed' || task.status === 'failed'),
      take(1),
      switchMap(task => {
        if (task.status === 'failed') {
          return throwError(() => new Error(task.error || 'Task failed'));
        }
        return of(task.result as T);
      })
    );
  }

  // ──── Lesson Content ────────────────────────────────────────────

  getLessonContent(path: string): Observable<ILessonContent> {
    return this.http
      .get<IAiResponse<{ task_id: string }>>(`${this.baseUrl}/content`, { params: { path } })
      .pipe(switchMap((res) => this.pollTask<ILessonContent>(res.data.task_id)));
  }

  getLessonQuiz(path: string): Observable<IQuizSet> {
    return this.http
      .get<IAiResponse<{ task_id: string }>>(`${this.baseUrl}/quiz`, { params: { path } })
      .pipe(switchMap((res) => this.pollTask<IQuizSet>(res.data.task_id)));
  }

  getLessonTrueFalse(path: string): Observable<ITrueFalseSet> {
    return this.http
      .get<IAiResponse<{ task_id: string }>>(`${this.baseUrl}/truefalse`, { params: { path } })
      .pipe(switchMap((res) => this.pollTask<ITrueFalseSet>(res.data.task_id)));
  }

  getLessonShortQuestions(path: string): Observable<IShortQuestionSet> {
    return this.http
      .get<IAiResponse<{ task_id: string }>>(`${this.baseUrl}/shortquestions`, { params: { path } })
      .pipe(switchMap((res) => this.pollTask<IShortQuestionSet>(res.data.task_id)));
  }

  // ──── Embedding Comparison ──────────────────────────────────────

  compareTextToEmbedding(
    text: string,
    embedding: number[]
  ): Observable<{ match: boolean }> {
    return this.http
      .post<IAiResponse<{ match: boolean }>>(`${this.baseUrl}/compare`, {
        text,
        embedding,
      })
      .pipe(map((res) => res.data));
  }

  // ──── Hierarchy & Scores ────────────────────────────────────────

  getLessonHierarchy(): Observable<ILessonHierarchy[]> {
    return this.http
      .get<IAiResponse<ILessonHierarchy[]>>(`${this.baseUrl}/hierarchy`)
      .pipe(map((res) => res.data));
  }

  updateScores(
    path: string,
    scores: Partial<IScoreUpdate>
  ): Observable<{ message: string; updated: Record<string, string> }> {
    return this.http
      .post<IAiResponse<{ updated: Record<string, string> }>>(
        `${this.baseUrl}/scores`,
        { path, ...scores }
      )
      .pipe(map((res) => ({ message: res.message, updated: res.data.updated })));
  }
}
