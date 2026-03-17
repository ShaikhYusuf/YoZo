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

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private apiUrl = 'http://localhost:3000/v1'; // Base Node API
  private aiUrl = 'http://localhost:3000/v1/ai'; // AI Proxy routes
  private abortController: AbortController | null = null;

  NUMBER_OF_QUESTIONS = 3;

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private aiTaskService: AITaskService
  ) {}

  getLessonExplanation(lessonSectionId: number): Observable<any> {
    const path = `/content?path=${lessonSectionId}`;
    return this.http.get<any>(`${this.aiUrl}${path}`, { headers: this.headers }).pipe(
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
    return this.http.get<any>(`${this.aiUrl}${path}`, { headers: this.headers }).pipe(
      tap((res: any) => {
        if (res.data?.task_id) {
          this.aiTaskService.trackTask(res.data.task_id, path);
        }
      })
    );
  }

  getFillBlanks(lessonSectionId: number): Observable<IFillInTheBlank[]> {
    return this.http
      .get<string>(`${this.apiUrl}/${lessonSectionId}/fillblank`, {
        headers: this.headers,
      })
      .pipe(
        map((response: string) => {
          const fillBlanks: IFillInTheBlank[] = JSON.parse(response);
            const shuffledFillBlanks = this.shuffleQZFBArray(
              fillBlanks
            ) as IFillInTheBlank[];
            return shuffledFillBlanks
              .map((fillblank: IFillInTheBlank) => this.shuffleOptions(fillblank) as IFillInTheBlank)
              .slice(0, this.NUMBER_OF_QUESTIONS); // Return only the first 3 fill-in-the-blanks
        })
      );
  }

  getTrueFalse(lessonSectionId: number): Observable<any> {
    const path = `/truefalse?path=${lessonSectionId}`;
    return this.http.get<any>(`${this.aiUrl}${path}`, { headers: this.headers }).pipe(
      tap((res: any) => {
        if (res.data?.task_id) {
          this.aiTaskService.trackTask(res.data.task_id, path);
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
