import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IStandard } from './standard.model';
import { ApiHeadersService } from '../common/api-headers.service';

@Injectable({
  providedIn: 'root',
})
export class StandardService {
  private apiUrl = 'http://localhost:5050/v1';

  data: IStandard[] = [];

  constructor(
    private http: HttpClient,
    private apiHeaders: ApiHeadersService
  ) {}

  getAll(): Observable<IStandard[]> {
    return this.http.get<IStandard[]>(`${this.apiUrl}/standard`, {
      headers: this.apiHeaders.headers,
    });
  }

  get(inStandardId: number): Observable<IStandard> {
    return this.http.get<IStandard>(`${this.apiUrl}/standard/${inStandardId}`, {
      headers: this.apiHeaders.headers,
    });
  }

  add(inStandard: IStandard): Observable<IStandard> {
    return this.http.post<IStandard>(`${this.apiUrl}/standard`, inStandard, {
      headers: this.apiHeaders.headers,
    });
  }

  edit(inStandard: IStandard): Observable<IStandard> {
    return this.http.put<IStandard>(
      `${this.apiUrl}/standard/${inStandard.Id}`,
      inStandard,
      {
        headers: this.apiHeaders.headers,
      }
    );
  }

  delete(inStandardId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/standard/${inStandardId}`, {
      headers: this.apiHeaders.headers,
    });
  }
}
