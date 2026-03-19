import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'bg-surface border border-border rounded-lg overflow-hidden ' + class">
      @if (title) {
        <div class="px-6 py-4 border-b border-border">
          <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
          @if (subtitle) {
            <p class="text-sm text-muted mt-1">{{ subtitle }}</p>
          }
        </div>
      }
      <div [class]="noPadding ? '' : 'p-6'">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() noPadding: boolean = false;
  @Input() class: string = '';
}
