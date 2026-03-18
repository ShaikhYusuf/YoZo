import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

/**
 * Centralised HTTP header factory.
 * All API services should inject this instead of copying the header block.
 */
@Injectable({ providedIn: 'root' })
export class ApiHeadersService {
  get headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? 'Token';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      tenantid: 'tenanta',
      traceparent: '12345',
      Authorization: `Bearer ${token}`
    });
  }
}
