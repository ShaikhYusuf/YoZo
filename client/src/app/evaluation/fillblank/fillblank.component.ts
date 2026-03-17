import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EvaluationService } from '../evaluation.service';
import { VoiceService } from '../../voice/voice.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IFillBlankComponent } from './fillblank.component.model';

@Component({
  selector: 'app-fillblank',
  imports: [
    CommonModule,FormsModule],
  templateUrl: './fillblank.component.html',
  styleUrl: './fillblank.component.css',
})
export class FillBlankComponent implements OnInit {
  @Input() lessonId!: number;
  @Input() lessonsectionId!: number;
  @Output() score = new EventEmitter<number>(); // Ensure this emits a number

  fillBlanks: IFillBlankComponent[] = [];

  constructor(
    private evaluationService: EvaluationService,
    private voiceService: VoiceService
  ) {}

  private load() {
    this.evaluationService.getFillBlanks(this.lessonsectionId).subscribe((data: any[]) => {
      this.fillBlanks = data.map((q: any) => ({
        ...q,
        selectedAnswer: null,
        answered: false,
      }));
    });
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

  readAloud() {
    this.isReading = true;
    let textToRead = "Fill in the blank questions. ";
    this.fillBlanks.forEach((q, index) => {
      textToRead += `Question ${index + 1}: ${q.question.replace('______', 'blank')}. `;
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
