import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IStandard } from './standard.model';

@Injectable({
  providedIn: 'root',
})
export class StandardService {
  private apiUrl = 'http://localhost:3000/v1';

  data: IStandard[] = [];

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getAll(): Observable<IStandard[]> {
    return this.http.get<IStandard[]>(`${this.apiUrl}/standard`, {
      headers: this.headers,
    });
  }

  get(inStandardId: number): Observable<IStandard> {
    return this.http.get<IStandard>(`${this.apiUrl}/standard/${inStandardId}`, {
      headers: this.headers,
    });
  }

  add(inStandard: IStandard): Observable<IStandard> {
    return this.http.post<IStandard>(`${this.apiUrl}/standard`, inStandard, {
      headers: this.headers,
    });
  }

  edit(inStandard: IStandard): Observable<IStandard> {
    return this.http.put<IStandard>(
      `${this.apiUrl}/standard/${inStandard.Id}`,
      inStandard,
      {
        headers: this.headers,
      }
    );
  }

  delete(inStandardId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/standard/${inStandardId}`, {
      headers: this.headers,
    });
  }
}
