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

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private apiUrl = 'http://localhost:3000/v1/lessonsection';
  private baseUrl = `http://localhost:11434/api/generate`;
  private abortController: AbortController | null = null;

  NUMBER_OF_QUESTIONS = 3;

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getLessonExplanation(lessonSectionId: number): Observable<string> {
    return this.http.get<string>(
      `${this.apiUrl}/${lessonSectionId}/explanation`,
      {
        headers: this.headers,
      }
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

  getQuizzes(lessonSectionId: number): Observable<IQuiz[]> {
    return this.http
      .get<string>(`${this.apiUrl}/${lessonSectionId}/quiz`, {
        headers: this.headers,
      })
      .pipe(
        map((response) => {
          const quizzes: IQuiz[] = JSON.parse(response);
            const shuffledQuizzes = this.shuffleQZFBArray(quizzes) as IQuiz[];
            return shuffledQuizzes
            .map((quiz) => this.shuffleOptions(quiz))
            .slice(0, this.NUMBER_OF_QUESTIONS); // Return only the first 3 quizzes
        })
      );
  }

  getFillBlanks(lessonSectionId: number): Observable<IFillInTheBlank[]> {
    return this.http
      .get<string>(`${this.apiUrl}/${lessonSectionId}/fillblank`, {
        headers: this.headers,
      })
      .pipe(
        map((response) => {
          const fillBlanks: IFillInTheBlank[] = JSON.parse(response);
            const shuffledFillBlanks = this.shuffleQZFBArray(
              fillBlanks
            ) as IFillInTheBlank[];
            return shuffledFillBlanks
              .map((fillblank) => this.shuffleOptions(fillblank))
              .slice(0, this.NUMBER_OF_QUESTIONS); // Return only the first 3 fill-in-the-blanks
        })
      );
  }

  getTrueFalse(lessonSectionId: number): Observable<ITrueFalse[]> {
    return this.http
      .get<string>(`${this.apiUrl}/${lessonSectionId}/truefalse`, {
        headers: this.headers,
      })
      .pipe(
        map((response) => {
            const truefalse: ITrueFalse[] = JSON.parse(response);
            const shuffledTrueFalse = this.shuffleQZFBArray(
              truefalse
            ) as ITrueFalse[];
            return shuffledTrueFalse.slice(0, this.NUMBER_OF_QUESTIONS); // Return only the first 3 true/false questions
        })
      );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
    }

    // Return an observable with a user-facing error message
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }

  generateResponse(prompt: string): Observable<string> {
    return new Observable((observer) => {
      this.stopGeneration(); // Abort previous request if any
      this.abortController = new AbortController();

      const requestBody = {
        model: 'llama3.2',
        prompt: prompt,
        stream: true,
      };

      fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      })
        .then(async (response) => {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          if (!reader) {
            observer.error('Failed to read stream');
            return;
          }

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n');
            buffer = parts.pop() || ''; // Keep incomplete part

            parts.forEach((jsonString) => {
              try {
                if (jsonString.trim()) {
                  const jsonResponse = JSON.parse(jsonString);
                  observer.next(jsonResponse.response); // Send chunk to Angular
                  if (jsonResponse.done) observer.complete();
                }
              } catch (error) {
                console.error('⚠️ Error parsing JSON:', error, jsonString);
              }
            });
          }
          observer.complete();
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            console.log('⛔ Request aborted by user');
          } else {
            observer.error('Streaming error: ' + error);
          }
        });
    });
  }

  stopGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('⛔ Generation stopped.');
    }
  }

  ngOnDestroy() {
    this.stopGeneration();
  }
}
