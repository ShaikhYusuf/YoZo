import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-xp-bar',
  imports: [CommonModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './xp-bar.component.html',
})
export class XpBarComponent implements OnInit {
  @Input() currentXp: number = 0;
  @Input() maxXp: number = 1000;
  @Input() level: number = 1;
  @Input() showLabel: boolean = true;

  // The actual width percentage applied to the DOM
  animatedWidth: number = 0;

  ngOnInit() {
    // Trigger animation shortly after init so it grows from 0
    setTimeout(() => {
      this.animatedWidth = this.percentage;
    }, 100);
  }

  get percentage(): number {
    if (this.maxXp === 0) return 0;
    const raw = (this.currentXp / this.maxXp) * 100;
    // Bound between 0 and 100
    return Math.min(Math.max(raw, 0), 100);
  }
}
