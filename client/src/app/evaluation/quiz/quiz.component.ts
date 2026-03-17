import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EvaluationService } from '../evaluation.service';
import { VoiceService } from '../../voice/voice.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IQuizComponent } from './quiz.component.model';
import { AITaskService } from '../../common/ai-task.service';

@Component({
  selector: 'app-quiz',
  imports: [
    CommonModule,FormsModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css',
})
export class QuizComponent implements OnInit {
  @Input() lessonId!: number;
  @Input() lessonsectionId!: number;
  @Output() score = new EventEmitter<number>(); // Ensure this emits a number

  quizzes: IQuizComponent[] = [];

  constructor(
    private evalationService: EvaluationService,
    private voiceService: VoiceService,
    private aiTaskService: AITaskService
  ) {}

  private load() {
    this.evalationService.getQuizzes(this.lessonsectionId).subscribe();
    
    this.aiTaskService.getUpdates().subscribe((update: any) => {
      if (update.path.includes('quiz') && update.path.includes(this.lessonsectionId.toString())) {
        if (update.status === 'completed' && update.result) {
          try {
            const rawData = typeof update.result === 'string' ? JSON.parse(update.result) : update.result;
            this.quizzes = rawData.map((q: any) => ({
              ...q,
              selectedAnswer: null,
              answered: false,
            }));
          } catch (e) {
            console.error('Failed to parse quiz result:', e);
          }
        }
      }
    });
  }

  ngOnInit() {
    this.load();
  }

  resetQuiz() {
    this.load();
  }

  submitAnswers() {
    let calculatedScore = 0;
    this.quizzes.forEach((eachQuiz: any) => {
      calculatedScore += +(eachQuiz.answer == eachQuiz.selectedAnswer);
      eachQuiz.answered = true;
    });
    this.score.emit((calculatedScore / this.quizzes.length) * 100);
  }
  isAnyQuizAttempted(): boolean {
    return this.quizzes.some((quiz: any) => quiz.selectedAnswer !== null);
  }

  isReading = false;

  readAloud() {
    this.isReading = true;
    let textToRead = "Quiz Questions. ";
    this.quizzes.forEach((q: any, index: number) => {
      textToRead += `Question ${index + 1}: ${q.question}. `;
      q.options.forEach((opt: string, optIndex: number) => {
        textToRead += `Option ${optIndex + 1}: ${opt}. `;
      });
    });
    this.voiceService.speak(textToRead, () => {
      this.isReading = false;
    });
  }

  stopReading() {
    this.voiceService.stopSpeaking();
    this.isReading = false;
  }
}
