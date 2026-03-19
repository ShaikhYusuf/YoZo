import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="['skeleton-wrapper', type]" [style.height]="height" [style.width]="width">
      <div class="skeleton-shimmer"></div>
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      background: #f0f0f0;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      margin-bottom: 12px;
    }
    
    .skeleton-shimmer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .text { height: 16px; width: 100%; }
    .heading { height: 24px; width: 60%; }
    .card { height: 120px; width: 100%; }
    .round { border-radius: 50%; }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: 'text' | 'heading' | 'card' | 'round' = 'text';
  @Input() height: string = '';
  @Input() width: string = '';
}
