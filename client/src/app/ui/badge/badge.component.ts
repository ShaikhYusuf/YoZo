import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-badge',
  imports: [CommonModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [ngClass]="getClasses()"><ng-content></ng-content></span>`,
})
export class BadgeComponent {
  @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'default' = 'default';
  @Input() class: string = '';

  getClasses(): string {
    const base = 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium';

    const variants: Record<string, string> = {
      success: 'bg-success-light text-success border border-success-border',
      warning: 'bg-warning-light text-warning border border-warning-border',
      danger: 'bg-danger-light text-danger border border-danger-border',
      info: 'bg-info-light text-info border border-info-border',
      default: 'bg-surface-hover text-foreground border border-border',
    };

    return `${base} ${variants[this.variant]} ${this.class}`;
  }
}
