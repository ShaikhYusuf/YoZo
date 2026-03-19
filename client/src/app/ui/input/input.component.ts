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
        <label class="mb-1 text-sm font-medium text-foreground">{{ label }}</label>
      }
      <input
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [(ngModel)]="value"
        (ngModelChange)="onValueChange($event)"
        (blur)="onTouched()"
        [class]="'w-full h-10 bg-surface border rounded-md px-4 text-base text-foreground outline-none transition-colors ' +
                 (error ? 'border-danger focus-visible:ring-2 focus-visible:ring-danger/20 ' : 'border-border focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary ') +
                 'placeholder:text-muted disabled:opacity-50 disabled:pointer-events-none ' + class"
      />
      @if (error) {
        <span class="mt-1 text-sm text-danger">{{ error }}</span>
      }
      @if (hint && !error) {
        <span class="mt-1 text-xs text-muted">{{ hint }}</span>
      }
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() hint: string = '';
  @Input() error: string = '';
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
