import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EvaluationService } from '../evaluation.service';
import { VoiceService } from '../../voice/voice.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IFillBlankComponent } from './fillblank.component.model';
import { AITaskService } from '../../common/ai-task.service';

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
    private voiceService: VoiceService,
    private aiTaskService: AITaskService
  ) {}

  private load() {
    this.evaluationService.getFillBlanks(this.lessonsectionId).subscribe();

    this.aiTaskService.getUpdates().subscribe((update: any) => {
      if (update.path.includes('fillblank') && update.path.includes(this.lessonsectionId.toString())) {
        if (update.status === 'completed' && update.result) {
          try {
            const rawData = typeof update.result === 'string' ? JSON.parse(update.result) : update.result;
            if (rawData && rawData.questions) {
              this.fillBlanks = rawData.questions.map((q: any) => ({
                ...q,
                selectedAnswer: null,
                answered: false,
              }));
            }
          } catch (e) {
            console.error('Failed to parse fill-blank result:', e);
          }
        }
      }
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
