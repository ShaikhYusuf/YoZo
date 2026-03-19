import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EvaluationService } from '../evaluation.service'; // Import service if you are fetching the data from backend
import { VoiceService } from '../../voice/voice.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ITrueFalseComponent } from './truefalse.component.model';
import { AITaskService } from '../../common/ai-task.service';
import { AuthService } from '../../common/auth.service';
import { SkeletonLoaderComponent } from '../../ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-truefalse',
  imports: [
    CommonModule,FormsModule,SkeletonLoaderComponent],
  templateUrl: './truefalse.component.html',
  styleUrls: ['./truefalse.component.css'],
})
export class TrueFalseComponent implements OnInit {
  @Input() lessonId!: number;
  @Input() lessonsectionId!: number;
  @Output() score = new EventEmitter<number>(); // Ensure this emits a number

  trueFalseQuestions: ITrueFalseComponent[] = [];
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

  // Load the questions
  private load() {
    this.isLoading = true;
    this.isError = false;
    this.errorMessage = '';
    this.trueFalseQuestions = [];

    this.evaluationService.getTrueFalse(this.lessonsectionId).subscribe({
      next: (res: any) => {
        if (res.data?.task_id) {
          this.currentTaskId = res.data.task_id;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = 'Failed to initiate true/false generation.';
      }
    });

    this.aiTaskService.getUpdates().subscribe((update: any) => {
      const isMatch = (this.currentTaskId && update.taskId === this.currentTaskId) || 
                      (update.path.includes('truefalse') && update.path.includes(this.lessonsectionId.toString()));

      if (isMatch) {
        if (update.status === 'completed') {
          this.isLoading = false;
          if (update.result) {
            try {
              const rawData = typeof update.result === 'string' ? JSON.parse(update.result) : update.result;
              if (rawData && rawData.questions && rawData.questions.length > 0) {
                this.trueFalseQuestions = rawData.questions.map((q: any) => ({
                  ...q,
                  selectedAnswer: null,
                  answered: false,
                }));
              } else {
                this.isError = true;
                this.errorMessage = 'Question content is empty.';
              }
            } catch (e) {
              console.error('Failed to parse true/false result:', e);
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

  // Handle Submit
  submitAnswers() {
    let calculatedScore = 0;
    this.trueFalseQuestions.forEach((eachTrueFalse: any) => {
      calculatedScore += +(
        eachTrueFalse.answer == eachTrueFalse.selectedAnswer
      );
      eachTrueFalse.answered = true;
    });
    this.score.emit((calculatedScore / this.trueFalseQuestions.length) * 100);
  }

  // Reset the questions
  resetTrueFalse() {
    this.load();
  }

  // Check if any answer has been selected
  isAnyAnswerSelected(): boolean {
    return this.trueFalseQuestions.some(
      (question: any) => question.selectedAnswer !== null
    );
  }

  isReading = false;
  isPaused = false;

  readAloud() {
    this.isReading = true;
    this.isPaused = false;
    let textToRead = "True or False questions. ";
    this.trueFalseQuestions.forEach((q: any, index: number) => {
      textToRead += `Question ${index + 1}: ${q.question}. `;
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
        if (lowercaseText.includes("true")) {
          this.trueFalseQuestions[questionIndex].selectedAnswer = true;
        } else if (lowercaseText.includes("false")) {
          this.trueFalseQuestions[questionIndex].selectedAnswer = false;
        }
      }
    });
  }
}
