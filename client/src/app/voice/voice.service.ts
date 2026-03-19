import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

@Injectable({ providedIn: 'root' })
export class VoiceService {

  private voiceSubject = new BehaviorSubject<SpeechSynthesisVoice | null>(null);
  selectedVoice$ = this.voiceSubject.asObservable();

  private volumeSubject = new BehaviorSubject<number>(0);
  volume$ = this.volumeSubject.asObservable();

  private recognition: any = null;
  private listening = false;
  private speechRate = 1;

  // Audio Context for visualizer
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private animationId: any;

  constructor(private ngZone: NgZone) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SR) {
      this.recognition = new SR();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;
    }

    this.ensureDefaultVoice();
  }

  private ensureDefaultVoice() {
    const setDefault = () => {
      if (this.voiceSubject.value) return;
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoice = voices.find(v => v.lang.startsWith('en') && v.localService);
        this.voiceSubject.next(englishVoice || voices[0]);
      }
    };

    setDefault();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => setDefault();
    }
  }

  setVoice(voice: SpeechSynthesisVoice) {
    this.voiceSubject.next(voice);
  }

  setRate(rate: number) {
    this.speechRate = Math.max(0.25, Math.min(2, rate));
  }

  getRate(): number {
    return this.speechRate;
  }

  private startVolumeMonitoring() {
    if (this.audioContext) return;

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      this.analyser.fftSize = 256;

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(1, average / 128); // Normalize to 0-1
        this.volumeSubject.next(normalized);
        this.animationId = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    }).catch(err => console.error('Audio monitoring failed:', err));
  }

  private stopVolumeMonitoring() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.microphone = null;
    this.volumeSubject.next(0);
  }

  private simulateVolumePulse() {
    let phase = 0;
    const pulse = () => {
      if (!window.speechSynthesis.speaking) {
        this.volumeSubject.next(0);
        return;
      }
      phase += 0.2;
      const vol = 0.3 + Math.sin(phase) * 0.2; // Pulse between 0.1 and 0.5
      this.volumeSubject.next(vol);
      requestAnimationFrame(pulse);
    };
    pulse();
  }

  speak(text: string, onEnd?: () => void) {
    const voice = this.voiceSubject.value;
    if (!voice) return;

    window.speechSynthesis.cancel();
    this.stopListening();

    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = voice;
    utter.rate = this.speechRate;

    utter.onstart = () => {
      this.simulateVolumePulse();
    };

    utter.onend = () => {
      this.ngZone.run(() => {
        this.volumeSubject.next(0);
        onEnd?.();
      });
    };

    window.speechSynthesis.speak(utter);
  }

  stopSpeaking() {
    window.speechSynthesis.cancel();
    this.stopListening();
    this.volumeSubject.next(0);
  }

  pauseSpeaking() {
    window.speechSynthesis.pause();
    this.volumeSubject.next(0);
  }

  resumeSpeaking() {
    window.speechSynthesis.resume();
  }

  listen(callback: (heard: string) => void, minSilenceMs = 3000) {
    if (!this.recognition) {
       console.warn('SpeechRecognition API not available.');
       callback('');
       return;
    }

    this.stopSpeaking();
    this.startVolumeMonitoring();

    let finished = false;
    let finalTranscript = '';
    let interimTranscript = '';
    let silenceTimer: any;
    let userHasSpoken = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(silenceTimer);
      this.stopListening();
      this.stopVolumeMonitoring();

      const result = finalTranscript || interimTranscript;
      this.ngZone.run(() => {
        callback(result.trim());
      });
    };

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimer);
      const timeout = userHasSpoken ? minSilenceMs : Math.max(minSilenceMs, 5000);
      silenceTimer = setTimeout(() => {
        finish();
      }, timeout);
    };

    this.recognition.onresult = (event: any) => {
      interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        let bestTranscript = result[0].transcript;
        if (result.isFinal) finalTranscript += bestTranscript + ' ';
        else interimTranscript += bestTranscript + ' ';
      }
      userHasSpoken = true;
      resetSilenceTimer();
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (['not-allowed', 'audio-capture', 'service-not-allowed'].includes(event.error)) {
         finish();
      }
    };

    this.recognition.onend = () => {
      if (!finished && this.listening) {
        try { this.recognition.start(); } catch {}
      } else if (!finished) {
        finish();
      }
    };

    try {
      this.recognition.start();
      this.listening = true;
      resetSilenceTimer();
    } catch (e) {
      console.error('Recognition start failed:', e);
      finish();
    }
  }

  private stopListening() {
    if (!this.recognition || !this.listening) return;
    try { this.recognition.stop(); } catch {}
    this.listening = false;
    this.volumeSubject.next(0);
  }
}
