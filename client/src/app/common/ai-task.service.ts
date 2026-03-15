import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

export interface AITaskUpdate {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  path: string;
  result?: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AITaskService {
  private socket: Socket;
  private taskUpdates$ = new Subject<AITaskUpdate>();
  
  // Track active tasks locally
  activeTasks = signal<Map<string, AITaskUpdate>>(new Map());

  constructor() {
    this.socket = io('http://localhost:3000'); // Node server URL

    this.socket.on('connect', () => {
      console.log('Connected to AI Task WebSocket');
    });

    this.socket.on('ai_task_update', (update: AITaskUpdate) => {
      console.log('AI Task Update received:', update);
      this.handleUpdate(update);
    });
  }

  private handleUpdate(update: AITaskUpdate) {
    const currentTasks = new Map(this.activeTasks());
    currentTasks.set(update.taskId, update);
    this.activeTasks.set(currentTasks);
    this.taskUpdates$.next(update);

    // If completed or failed, we could cleanup after some time
    if (update.status === 'completed' || update.status === 'failed') {
      setTimeout(() => {
        const tasks = new Map(this.activeTasks());
        tasks.delete(update.taskId);
        this.activeTasks.set(tasks);
      }, 30000); // Keep for 30s for UI to show success/fail
    }
  }

  getUpdates(): Observable<AITaskUpdate> {
    return this.taskUpdates$.asObservable();
  }

  getTaskStatus(taskId: string) {
    return this.activeTasks().get(taskId);
  }

  // Helper to start tracking a task given its ID (received from HTTP)
  trackTask(taskId: string, initialPath: string) {
    const currentTasks = new Map(this.activeTasks());
    const initialUpdate: AITaskUpdate = {
      taskId,
      status: 'pending',
      path: initialPath
    };
    currentTasks.set(taskId, initialUpdate);
    this.activeTasks.set(currentTasks);
    return initialUpdate;
  }
}
