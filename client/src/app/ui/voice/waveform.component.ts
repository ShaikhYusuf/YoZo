import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input } from '@angular/core';
import { VoiceService } from '../../voice/voice.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-waveform',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="waveform-container" [style.height.px]="height">
      <canvas #waveformCanvas [width]="width" [height]="height"></canvas>
    </div>
  `,
  styles: [`
    .waveform-container {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      width: 100%;
    }
    canvas {
      filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
    }
  `]
})
export class WaveformComponent implements OnInit, OnDestroy {
  @ViewChild('waveformCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  @Input() width = 300;
  @Input() height = 100;
  @Input() color = '#6366f1'; // Indigo-500
  @Input() activeColor = '#a855f7'; // Purple-500

  private ctx!: CanvasRenderingContext2D;
  private animationId: any;
  private volume = 0;

  constructor(private voiceService: VoiceService) {}

  ngOnInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.voiceService.volume$.subscribe(v => {
      this.volume = v;
    });
    this.draw();
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    const barCount = 40;
    const barWidth = (this.width / barCount) * 0.8;
    const barGap = (this.width / barCount) * 0.2;
    const centerY = this.height / 2;

    for (let i = 0; i < barCount; i++) {
      // Calculate a "natural" height based on volume and a small random jitter
      const distanceToCenter = Math.abs(i - barCount / 2) / (barCount / 2);
      const intensity = Math.max(0.1, this.volume * (1 - distanceToCenter));
      const jitter = (Math.random() - 0.5) * 0.1 * this.volume;
      const barHeight = Math.max(4, (intensity + jitter) * this.height * 0.8);

      const x = i * (barWidth + barGap);
      const y = centerY - barHeight / 2;

      const gradient = this.ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, this.activeColor);
      gradient.addColorStop(1, this.color);

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth, barHeight, 4);
      this.ctx.fill();
    }

    this.animationId = requestAnimationFrame(() => this.draw());
  }
}
