import { Component, Input, forwardRef, booleanAttribute, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex flex-col w-full">
      @if (label) {
        <label class="mb-1.5 text-sm font-medium text-foreground tracking-tight">{{ label }}</label>
      }
      <input
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        (blur)="onTouched()"
        [class]="'bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm ' + 
                 'text-foreground outline-none transition-all duration-200 ' + 
                 'focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted ' + 
                 'disabled:opacity-50 disabled:cursor-not-allowed ' + class"
      />
      @if (hint) {
        <span class="mt-1.5 text-xs text-muted">{{ hint }}</span>
      }
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() hint: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input({ transform: booleanAttribute }) disabled: boolean = false;
  @Input() class: string = '';

  value: string = '';

  onChange: any = () => {};
  onTouched: any = () => {};

  onValueChange(val: string) {
    this.value = val;
    this.onChange(val);
  }

  writeValue(val: string): void {
    this.value = val || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
