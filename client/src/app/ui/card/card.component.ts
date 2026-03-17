import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'bg-surface/80 backdrop-blur-md border border-surface-border shadow-glass rounded-xl overflow-hidden ' + class">
      @if (title) {
        <div class="px-6 py-4 border-b border-surface-border">
          <h3 class="text-lg font-semibold text-foreground tracking-tight">{{ title }}</h3>
          @if (subtitle) {
            <p class="text-sm text-muted mt-1">{{ subtitle }}</p>
          }
        </div>
      }
      <div class="p-6">
        <ng-content></ng-content>
      </div>
      @if (footerHtml) {
        <div class="px-6 py-4 bg-surface-hover/50 border-t border-surface-border" [innerHTML]="footerHtml">
        </div>
      }
    </div>
  `
})
export class CardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() footerHtml: string = '';
  @Input() class: string = '';
}
