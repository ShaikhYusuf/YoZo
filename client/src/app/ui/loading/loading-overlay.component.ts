import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AITaskService, AITaskUpdate } from '../../common/ai-task.service';

@Component({
  selector: 'ui-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="hasActiveTasks()" class="fixed inset-0 z-modal flex items-center justify-center bg-background/60 backdrop-blur-sm transition-all">
      <div class="relative w-full max-w-md p-6 rounded-lg bg-surface border border-border shadow-lg animate-fade-in">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-foreground">Processing…</h3>
            <span class="text-xs font-medium text-primary bg-primary-light px-2 py-1 rounded-full border border-primary/20">AI Engine</span>
          </div>

          <div class="space-y-4">
            <div *ngFor="let task of getTasks()" class="p-4 rounded-md bg-surface-hover border border-border">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-foreground">{{ getTaskLabel(task.path) }}</span>
                <span [ngClass]="getStatusClasses(task.status)" class="text-xs font-medium px-2 py-1 rounded-full">
                  {{ task.status }}
                </span>
              </div>

              <!-- Progress Bar -->
              <div class="h-1 w-full bg-border rounded-full overflow-hidden">
                <div [ngClass]="{
                  'w-1/3': task.status === 'pending',
                  'w-2/3': task.status === 'running',
                  'w-full bg-success': task.status === 'completed',
                  'w-full bg-danger': task.status === 'failed'
                }" class="h-full bg-primary transition-all rounded-full"></div>
              </div>

              <p *ngIf="task.error" class="mt-2 text-sm text-danger">
                {{ task.error }}
              </p>
            </div>
          </div>

          <p class="text-center text-xs text-muted">
            This usually takes 10–20 seconds.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoadingOverlayComponent {
  private aiTaskService = inject(AITaskService);

  hasActiveTasks(): boolean {
    return this.aiTaskService.activeTasks().size > 0;
  }

  getTasks(): AITaskUpdate[] {
    return Array.from(this.aiTaskService.activeTasks().values());
  }

  getTaskLabel(path: string): string {
    if (path.includes('quiz')) return 'Generating Interactive Quiz';
    if (path.includes('truefalse')) return 'Creating True/False Challenges';
    if (path.includes('content')) return 'Analyzing Lesson Context';
    return 'Processing AI Task';
  }

  getStatusClasses(status: string): string {
    switch (status) {
      case 'completed': return 'text-success bg-success-light';
      case 'failed': return 'text-danger bg-danger-light';
      case 'running': return 'text-primary bg-primary-light animate-pulse';
      default: return 'text-muted bg-surface-hover';
    }
  }
}
