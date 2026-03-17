import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ILoginDetail } from './logindetail.model';

@Injectable({
  providedIn: 'root',
})
export class LoginDetailService {
  private apiUrl = 'http://localhost:3000/v1';

  data: ILoginDetail[] = [];

  // Define the headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    tenantid: 'tenanta',
    traceparent: '12345',
    Authorization: 'Bearer Token', // Replace "Token" with your actual token
  });

  constructor(private http: HttpClient) {}

  getAll(): Observable<ILoginDetail[]> {
    return this.http.get<ILoginDetail[]>(`${this.apiUrl}/logindetail`, {
      headers: this.headers,
    });
  }

  get(inLoginDetailId: number): Observable<ILoginDetail> {
    return this.http.get<ILoginDetail>(
      `${this.apiUrl}/logindetail/${inLoginDetailId}`,
      {
        headers: this.headers,
      }
    );
  }

  add(inLoginDetail: ILoginDetail): Observable<ILoginDetail> {
    return this.http.post<ILoginDetail>(
      `${this.apiUrl}/logindetail`,
      inLoginDetail,
      {
        headers: this.headers,
      }
    );
  }

  edit(inLoginDetail: ILoginDetail): Observable<ILoginDetail> {
    return this.http.put<ILoginDetail>(
      `${this.apiUrl}/logindetail/${inLoginDetail.Id}`,
      inLoginDetail,
      {
        headers: this.headers,
      }
    );
  }

  delete(inLoginDetailId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/logindetail/${inLoginDetailId}`,
      {
        headers: this.headers,
      }
    );
  }
}
