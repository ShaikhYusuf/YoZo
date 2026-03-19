import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, ReplaySubject } from 'rxjs';

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
  private taskUpdates$ = new ReplaySubject<AITaskUpdate>(20);
  
  // Track active tasks locally
  activeTasks = signal<Map<string, AITaskUpdate>>(new Map());
  private completedTaskIds = new Set<string>();

  constructor() {
    this.socket = io('http://localhost:5050'); // Node server URL

    this.socket.on('connect', () => {
    });

    this.socket.on('ai_task_update', (update: AITaskUpdate) => {
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
      this.completedTaskIds.add(update.taskId);
      setTimeout(() => {
        const tasks = new Map(this.activeTasks());
        tasks.delete(update.taskId);
        this.activeTasks.set(tasks);
      }, 60000); // Keep for 60s for UI to show success/fail
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
    // Race condition prevention: The socket event for completion might have arrived BEFORE the HTTP response!
    // If the task already exists OR was recently completed and removed, do not overwrite it with 'pending'.
    if (this.completedTaskIds.has(taskId) || this.activeTasks().has(taskId)) {
      return this.activeTasks().get(taskId) || { taskId, status: 'completed', path: initialPath };
    }

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
