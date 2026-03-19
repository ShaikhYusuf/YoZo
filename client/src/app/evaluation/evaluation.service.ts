import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, from, Observable, of, throwError } from 'rxjs';
import {
  catchError,
  concatMap,
  map,
  reduce,
  switchMap,
  tap,
} from 'rxjs/operators';
import { IFillInTheBlank, IQuiz, ITrueFalse } from './evaluation.service.model';
import { LoadingService } from '../common/loading.service';
import { AITaskService } from '../common/ai-task.service';

import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private apiUrl = 'http://localhost:5050/v1'; // Base Node API
  private aiUrl = 'http://localhost:5050/v1/ai'; // AI Proxy routes
  private abortController: AbortController | null = null;

  NUMBER_OF_QUESTIONS = 3;

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private aiTaskService: AITaskService,
    private apiHeaders: ApiHeadersService
  ) {}

  getLessonExplanation(lessonSectionId: number): Observable<any> {
    const path = `/content?path=${lessonSectionId}`;
    return this.http.get<any>(`${this.aiUrl}${path}`, { headers: this.apiHeaders.headers }).pipe(
      tap((res: any) => {
        if (res.data?.task_id) {
          this.aiTaskService.trackTask(res.data.task_id, path);
        }
      })
    );
  }

    private shuffleQZFBArray(
      quizArray: (IQuiz | IFillInTheBlank | ITrueFalse)[]
    ): (IQuiz | IFillInTheBlank | ITrueFalse)[] {
      const shuffledArray = [...quizArray];
  
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [
          shuffledArray[j],
          shuffledArray[i],
        ];
      }
      return shuffledArray;
    }
    private shuffleOptions(
      qzfb: IQuiz | IFillInTheBlank
    ): IQuiz | IFillInTheBlank {
      const options = [...qzfb.options];
      const correctAnswer = options[qzfb.answer];
  
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
  
      return { ...qzfb, options, answer: options.indexOf(correctAnswer) };
    }

  getQuizzes(lessonSectionId: number): Observable<any> {
    const path = `/quiz?path=${lessonSectionId}`;
    return this.http.get<any>(`${this.aiUrl}${path}`, { headers: this.apiHeaders.headers }).pipe(
      tap((res: any) => {
        if (res.data?.task_id) {
          this.aiTaskService.trackTask(res.data.task_id, path);
        }
      })
    );
  }

  getFillBlanks(lessonSectionId: number): Observable<any> {
    const path = `/fillblank?path=${lessonSectionId}`;
    return this.http.get<any>(`${this.aiUrl}${path}`, { headers: this.apiHeaders.headers }).pipe(
      tap((res: any) => {
        if (res.data?.task_id) {
          this.aiTaskService.trackTask(res.data.task_id, path);
        }
      })
    );
  }

  getTrueFalse(lessonSectionId: number): Observable<any> {
    const path = `/truefalse?path=${lessonSectionId}`;
    return this.http.get<any>(`${this.aiUrl}${path}`, { headers: this.apiHeaders.headers }).pipe(
      tap((res: any) => {
        if (res.data?.task_id) {
          this.aiTaskService.trackTask(res.data.task_id, path);
        }
      })
    );
  }

  sendChat(lessonSectionId: number, prompt: string): Observable<any> {
    const path = `/chat`;
    return this.http.post<any>(`${this.aiUrl}${path}`, {
      path: lessonSectionId.toString(),
      prompt: prompt
    }, { headers: this.apiHeaders.headers }).pipe(
      tap((res: any) => {
        if (res.data?.task_id) {
          this.aiTaskService.trackTask(res.data.task_id, `/chat?path=${lessonSectionId}`);
        }
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  ngOnDestroy() {
    if (this.abortController) this.abortController.abort();
  }
}
