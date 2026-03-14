import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EvaluationService } from '../evaluation.service'; // Import service if you are fetching the data from backend
import { VoiceService } from '../../10.voice/voice.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { ITrueFalseComponent } from './truefalse.component.model';

@Component({
  selector: 'app-truefalse',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatRadioModule,
    FormsModule,
  ],
  templateUrl: './truefalse.component.html',
  styleUrls: ['./truefalse.component.css'],
})
export class TrueFalseComponent implements OnInit {
  @Input() lessonId!: number;
  @Input() lessonsectionId!: number;
  @Output() score = new EventEmitter<number>(); // Ensure this emits a number

  trueFalseQuestions: ITrueFalseComponent[] = [];

  constructor(
    private evaluationService: EvaluationService,
    private voiceService: VoiceService
  ) {}

  // Load the questions
  private load() {
    this.evaluationService.getTrueFalse(this.lessonsectionId).subscribe((data) => {
      this.trueFalseQuestions = data.map((q) => ({
        ...q,
        selectedAnswer: null,
        answered: false,
      }));
    });
  }

  ngOnInit() {
    this.load();
  }

  // Handle Submit
  submitAnswers() {
    let calculatedScore = 0;
    this.trueFalseQuestions.forEach((eachTrueFalse) => {
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
      (question) => question.selectedAnswer !== null
    );
  }

  isReading = false;

  readAloud() {
    this.isReading = true;
    let textToRead = "True or False questions. ";
    this.trueFalseQuestions.forEach((q, index) => {
      textToRead += `Question ${index + 1}: ${q.question}. `;
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
