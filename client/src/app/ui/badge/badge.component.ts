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
  @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'xp' | 'streak' = 'default';
  @Input() class: string = '';
  
  // Base classes including the Framer Motion-style hover/scale effects
  get baseClasses(): string {
    return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 cursor-default group';
  }

  getClasses() {
    let variantClasses = '';
    
    if (this.variant === 'success') {
      variantClasses = 'bg-green-100 text-green-800 border border-green-200 ';
    } else if (this.variant === 'warning') {
      variantClasses = 'bg-amber-100 text-amber-800 border border-amber-200 ';
    } else if (this.variant === 'danger') {
      variantClasses = 'bg-red-100 text-red-800 border border-red-200 ';
    } else if (this.variant === 'info') {
      variantClasses = 'bg-blue-100 text-blue-800 border border-blue-200 ';
    } else if (this.variant === 'xp') { // For gamification
      variantClasses = 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-glow-sm hover:shadow-glow ';
    } else if (this.variant === 'streak') { // For streaks
      variantClasses = 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-orange-400 border border-orange-500/20 shadow-glow-sm hover:shadow-glow ';
    } else {
      variantClasses = 'bg-surface-hover text-foreground border border-surface-border ';
    }

    return `${this.baseClasses} ${variantClasses} ${this.class}`;
  }
}
