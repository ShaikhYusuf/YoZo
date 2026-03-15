import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AITaskService, AITaskUpdate } from '../../common/ai-task.service';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'ui-loading-overlay',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <div *ngIf="hasActiveTasks()" class="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md transition-all duration-500">
      <div class="relative w-full max-w-md p-8 rounded-3xl bg-surface border border-surface-border shadow-2xl animate-fade-in-up">
        
        <!-- Animated Background Glow -->
        <div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-20 animate-pulse"></div>
        
        <div class="relative space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
              YoZo AI is thinking...
            </h3>
            <ui-badge variant="xp">AI Engine</ui-badge>
          </div>

          <div class="space-y-4">
            <div *ngFor="let task of getTasks()" class="p-4 rounded-2xl bg-surface-hover/50 border border-surface-border transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-foreground/80">{{ getTaskLabel(task.path) }}</span>
                <span [ngClass]="getStatusClasses(task.status)" class="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {{ task.status }}
                </span>
              </div>
              
              <!-- Progress Bar -->
              <div class="h-1.5 w-full bg-surface-border rounded-full overflow-hidden">
                <div [ngClass]="{
                  'w-1/3 animate-shimmer': task.status === 'pending',
                  'w-2/3 animate-progress-fast': task.status === 'running',
                  'w-full bg-green-500': task.status === 'completed',
                  'w-full bg-red-500': task.status === 'failed'
                }" class="h-full bg-indigo-500 transition-all duration-700 ease-out"></div>
              </div>

              <p *ngIf="task.error" class="mt-2 text-xs text-red-400 italic">
                Error: {{ task.error }}
              </p>
            </div>
          </div>

          <div class="pt-2 text-center">
            <p class="text-xs text-foreground/40 font-medium">
              This usually takes 10-20 seconds. Feel free to wait!
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes progress-fast {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-progress-fast {
      animation: progress-fast 2s infinite ease-in-out;
      background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.8), transparent);
    }
    .animate-shimmer {
      animation: progress-fast 3s infinite linear;
      background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent);
    }
  `]
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
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
      case 'running': return 'text-indigo-400 bg-indigo-400/10 animate-pulse';
      default: return 'text-purple-400 bg-purple-400/10';
    }
  }
}
