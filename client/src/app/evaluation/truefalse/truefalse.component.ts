import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EvaluationService } from '../evaluation.service'; // Import service if you are fetching the data from backend
import { VoiceService } from '../../voice/voice.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ITrueFalseComponent } from './truefalse.component.model';
import { AITaskService } from '../../common/ai-task.service';

@Component({
  selector: 'app-truefalse',
  imports: [
    CommonModule,FormsModule],
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
    private voiceService: VoiceService,
    private aiTaskService: AITaskService
  ) {}

  // Load the questions
  private load() {
    this.evaluationService.getTrueFalse(this.lessonsectionId).subscribe();

    this.aiTaskService.getUpdates().subscribe((update: any) => {
      if (update.path.includes('truefalse') && update.path.includes(this.lessonsectionId.toString())) {
        if (update.status === 'completed' && update.result) {
          try {
            const rawData = typeof update.result === 'string' ? JSON.parse(update.result) : update.result;
            if (rawData && rawData.questions) {
              this.trueFalseQuestions = rawData.questions.map((q: any) => ({
                ...q,
                selectedAnswer: null,
                answered: false,
              }));
            }
          } catch (e) {
            console.error('Failed to parse true/false result:', e);
          }
        }
      }
    });
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

  readAloud() {
    this.isReading = true;
    let textToRead = "True or False questions. ";
    this.trueFalseQuestions.forEach((q: any, index: number) => {
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
