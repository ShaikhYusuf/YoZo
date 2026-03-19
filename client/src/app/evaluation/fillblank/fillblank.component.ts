import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EvaluationService } from '../evaluation.service';
import { VoiceService } from '../../voice/voice.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IFillBlankComponent } from './fillblank.component.model';
import { AITaskService } from '../../common/ai-task.service';
import { AuthService } from '../../common/auth.service';
import { SkeletonLoaderComponent } from '../../ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-fillblank',
  imports: [
    CommonModule,FormsModule,SkeletonLoaderComponent],
  templateUrl: './fillblank.component.html',
  styleUrl: './fillblank.component.css',
})
export class FillBlankComponent implements OnInit {
  @Input() lessonId!: number;
  @Input() lessonsectionId!: number;
  @Output() score = new EventEmitter<number>(); // Ensure this emits a number

  fillBlanks: IFillBlankComponent[] = [];
  isLoading = false;
  isError = false;
  errorMessage = '';
  private currentTaskId: string | null = null;

  constructor(
    private evaluationService: EvaluationService,
    private voiceService: VoiceService,
    private aiTaskService: AITaskService,
    private authService: AuthService
  ) {}

  get isStudent() {
    return this.authService.user().role === 'student';
  }

  private load() {
    this.isLoading = true;
    this.isError = false;
    this.errorMessage = '';
    this.fillBlanks = [];

    this.evaluationService.getFillBlanks(this.lessonsectionId).subscribe({
      next: (res: any) => {
        if (res.data?.task_id) {
          this.currentTaskId = res.data.task_id;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = 'Failed to initiate fill-blank generation.';
      }
    });

    this.aiTaskService.getUpdates().subscribe((update: any) => {
      const isMatch = (this.currentTaskId && update.taskId === this.currentTaskId) || 
                      (update.path.includes('fillblank') && update.path.includes(this.lessonsectionId.toString()));

      if (isMatch) {
        if (update.status === 'completed') {
          this.isLoading = false;
          if (update.result) {
            try {
              const rawData = typeof update.result === 'string' ? JSON.parse(update.result) : update.result;
              if (rawData && rawData.questions && rawData.questions.length > 0) {
                this.fillBlanks = rawData.questions.map((q: any) => ({
                  ...q,
                  selectedAnswer: null,
                  answered: false,
                }));
              } else {
                this.isError = true;
                this.errorMessage = 'Content is empty.';
              }
            } catch (e) {
              console.error('Failed to parse fill-blank result:', e);
              this.isError = true;
              this.errorMessage = 'Failed to process evaluation data.';
            }
          } else {
            this.isError = true;
            this.errorMessage = 'No data received from AI service.';
          }
        } else if (update.status === 'failed') {
          this.isLoading = false;
          this.isError = true;
          this.errorMessage = update.result?.error?.message || update.error || 'AI Generation failed.';
        }
      }
    });
  }

  retry() {
    this.load();
  }

  ngOnInit() {
    this.load();
  }

  resetFillBlank() {
    this.load();
  }

  submitAnswers() {
    let calculatedScore = 0;
    this.fillBlanks.forEach((eachFillBlanks) => {
      calculatedScore += +(
        eachFillBlanks.answer == eachFillBlanks.selectedAnswer
      );
      eachFillBlanks.answered = true;
    });
    this.score.emit((calculatedScore / this.fillBlanks.length) * 100);
  }

  isAnyAnswerSelected(): boolean {
    return this.fillBlanks.some((question) => question.selectedAnswer !== null);
  }

  isReading = false;
  isPaused = false;

  readAloud() {
    this.isReading = true;
    this.isPaused = false;
    let textToRead = "Fill in the blank questions. ";
    this.fillBlanks.forEach((q, index) => {
      textToRead += `Question ${index + 1}: ${q.question.replace('______', 'blank')}. `;
      q.options.forEach((opt, optIndex) => {
        textToRead += `Option ${optIndex + 1}: ${opt}. `;
      });
    });
    this.voiceService.speak(textToRead, () => {
      this.isReading = false;
      this.isPaused = false;
    });
  }

  pauseReading() {
    this.isPaused = true;
    this.voiceService.pauseSpeaking();
  }

  resumeReading() {
    this.isPaused = false;
    this.voiceService.resumeSpeaking();
  }

  stopReading() {
    this.voiceService.stopSpeaking();
    this.isReading = false;
    this.isPaused = false;
  }

  isListeningToQuestion: number | null = null;

  startListening(questionIndex: number) {
    this.isListeningToQuestion = questionIndex;
    this.voiceService.listen((text: string) => {
      this.isListeningToQuestion = null;
      if (text) {
        const lowercaseText = text.toLowerCase().trim();
        let matchedIndex = -1;
        
        const optionMatch = lowercaseText.match(/option\s*(\d+)/i);
        if (optionMatch && optionMatch[1]) {
           const optNum = parseInt(optionMatch[1], 10);
           if (optNum > 0 && optNum <= this.fillBlanks[questionIndex].options.length) {
              matchedIndex = optNum - 1;
           }
        }
        
        if (matchedIndex === -1) {
          matchedIndex = this.fillBlanks[questionIndex].options.findIndex((o: string) => {
            const lowerCasedOpt = o.toLowerCase();
            return lowerCasedOpt === lowercaseText || 
                   lowerCasedOpt.includes(lowercaseText) || 
                   lowercaseText.includes(lowerCasedOpt);
          });
        }
        
        if (matchedIndex !== -1) {
           this.fillBlanks[questionIndex].selectedAnswer = matchedIndex;
        }
      }
    });
  }
}
