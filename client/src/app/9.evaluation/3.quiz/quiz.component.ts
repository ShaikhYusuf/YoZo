import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EvaluationService } from '../evaluation.service';
import { VoiceService } from '../../10.voice/voice.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { IQuizComponent } from './quiz.component.model';

@Component({
  selector: 'app-quiz',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    FormsModule,
    MatInputModule,
    MatRadioModule,
  ],
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
    private voiceService: VoiceService
  ) {}

  private load() {
    this.evalationService.getQuizzes(this.lessonsectionId).subscribe((data) => {
      this.quizzes = data.map((q) => ({
        ...q,
        selectedAnswer: null,
        answered: false,
      }));
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
    this.quizzes.forEach((eachQuiz) => {
      calculatedScore += +(eachQuiz.answer == eachQuiz.selectedAnswer);
      eachQuiz.answered = true;
    });
    this.score.emit((calculatedScore / this.quizzes.length) * 100);
  }
  isAnyQuizAttempted(): boolean {
    return this.quizzes.some((quiz) => quiz.selectedAnswer !== null);
  }

  isReading = false;

  readAloud() {
    this.isReading = true;
    let textToRead = "Quiz Questions. ";
    this.quizzes.forEach((q, index) => {
      textToRead += `Question ${index + 1}: ${q.question}. `;
      q.options.forEach((opt, optIndex) => {
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
