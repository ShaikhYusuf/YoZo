import { Component, Input, Output, EventEmitter, booleanAttribute, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
      [class]="getClasses()"
    >
      @if (loading) {
        <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input({ transform: booleanAttribute }) disabled: boolean = false;
  @Input({ transform: booleanAttribute }) loading: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() class: string = '';

  @Output() onClick = new EventEmitter<Event>();

  getClasses(): string {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-base',
    };

    const variants: Record<string, string> = {
      primary: 'bg-primary text-white hover:bg-primary-hover',
      secondary: 'bg-surface text-foreground border border-border hover:bg-surface-hover',
      danger: 'bg-danger text-white hover:bg-danger/90',
      ghost: 'text-muted hover:text-foreground hover:bg-surface-hover',
    };

    return `${base} ${sizes[this.size]} ${variants[this.variant]} ${this.class}`;
  }
}
