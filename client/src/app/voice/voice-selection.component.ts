// voice-selection.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VoiceService } from './voice.service';
import { WaveformComponent } from '../ui';

@Component({
  selector: 'app-voice-selection',
  standalone: true,
  imports: [
    CommonModule, FormsModule, WaveformComponent],
  templateUrl: './voice-selection.component.html',
  styleUrl: './voice-selection.component.css'
})
export class VoiceSelectionComponent implements OnInit {

  voices: SpeechSynthesisVoice[] = [];
  selectedVoice: SpeechSynthesisVoice | null = null;
  textToRead: string = "The only way to do great work is to love what you do.";
  speechRate: number = 1;
  isSpeaking = false;

  readonly speedPresets = [
    { label: 'Slow', value: 0.7, icon: 'slow_motion_video' },
    { label: 'Normal', value: 1, icon: 'play_arrow' },
    { label: 'Fast', value: 1.3, icon: 'fast_forward' },
    { label: 'Turbo', value: 1.6, icon: 'double_arrow' }];

  constructor(private voiceService: VoiceService, private router: Router) {}

  ngOnInit() {
    this.speechRate = this.voiceService.getRate();
    this.loadVoices();

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }

    this.voiceService.selectedVoice$.subscribe(v => {
      this.selectedVoice = v;
    });
  }

  selectVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
    this.voiceService.setVoice(voice);
  }

  getIconForPreset(label: string): string {
    switch(label) {
      case 'Slow': return 'fa-battery-quarter';
      case 'Normal': return 'fa-bolt';
      case 'Fast': return 'fa-forward-fast';
      case 'Turbo': return 'fa-gauge-high';
      default: return 'fa-play';
    }
  }

  loadVoices() {
    const allVoices = window.speechSynthesis.getVoices();
    this.voices = allVoices;

    if (this.voices.length > 0 && !this.selectedVoice) {
      this.selectedVoice = this.voices[0];
      this.voiceService.setVoice(this.selectedVoice);
    }
  }

  onSpeedChange(value: number) {
    this.speechRate = value;
    this.voiceService.setRate(value);
  }

  selectSpeedPreset(value: number) {
    this.speechRate = value;
    this.voiceService.setRate(value);
  }

  speak() {
    if (!this.selectedVoice || !this.textToRead) return;

    window.speechSynthesis.cancel();
    this.isSpeaking = true;

    // Use the voiceService so it respects the rate
    if (this.selectedVoice) {
      this.voiceService.setVoice(this.selectedVoice);
    }
    this.voiceService.speak(this.textToRead, () => {
      this.isSpeaking = false;
    });
  }

  stopSpeaking() {
    this.voiceService.stopSpeaking();
    this.isSpeaking = false;
  }

  getSpeedLabel(): string {
    if (this.speechRate <= 0.7) return 'Slow';
    if (this.speechRate <= 1.1) return 'Normal';
    if (this.speechRate <= 1.4) return 'Fast';
    return 'Turbo';
  }

  navigateToLesson() {
    if (this.selectedVoice) {
      this.voiceService.setVoice(this.selectedVoice);
    }
    this.router.navigate(['/']);
  }
}
