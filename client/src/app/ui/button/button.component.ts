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
      [disabled]="disabled"
      (click)="onClick.emit($event)"
      [class]="getClasses()"
    >
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  @Input({ transform: booleanAttribute }) disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() class: string = '';
  
  @Output() onClick = new EventEmitter<Event>();

  getClasses() {
    let base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ';
    
    if (this.variant === 'primary') {
      base += 'bg-primary text-white hover:bg-primary-hover hover:shadow-glow ';
    } else if (this.variant === 'secondary') {
      base += 'bg-surface text-foreground border border-surface-border hover:bg-surface-hover hover:shadow-subtle ';
    } else if (this.variant === 'danger') {
      base += 'bg-red-500 text-white hover:bg-red-600 ';
    } else if (this.variant === 'ghost') {
      base += 'text-muted hover:text-foreground hover:bg-surface-hover ';
    }

    return base + ` px-4 py-2 ${this.class}`;
  }
}
