import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private requestCount = 0;
  
  // Signal perfectly reactive for our top progress bar
  readonly isLoading = signal<boolean>(false);

  show() {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.isLoading.set(true);
    }
  }

  hide() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.isLoading.set(false);
    }
  }
}
