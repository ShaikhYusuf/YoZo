import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AiLessonService } from '../ai-lesson.service';
import { VoiceService } from '../../voice/voice.service';
import { IQuizSet, IScoreUpdate } from '../lesson-ai.model';


@Component({
  selector: 'app-ai-lesson-quiz',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, MatRadioModule, MatButtonModule, MatCardModule],
  templateUrl: './lesson-quiz.component.html',
  styleUrls: ['./lesson-quiz.component.css'],
})
export class AiLessonQuizComponent implements OnInit {
  quizSet!: IQuizSet;
  currentIndex = 0;
  selectedOption: string = '';
  history: { question: string; answer: string; userAnswer: string; isCorrect: boolean }[] = [];
  isShowingFeedback = false;
  nextPage: string = '/lesson-ai-truefalse';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private aiLessonService: AiLessonService,
    private voiceService: VoiceService,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.voiceService.stopSpeaking();
      }
    });
  }

  ngOnInit() {
    const path = this.route.snapshot.queryParams['path'];
    this.nextPage = this.route.snapshot.queryParams['next'] || '/lesson-ai-truefalse';
    this.aiLessonService.getLessonQuiz(path).subscribe((data: IQuizSet) => {
      this.quizSet = data;
      this.readCurrentQuestion();
      this.history = [];
    });
  }

  formatQuestionForSpeech(): string {
    const q = this.quizSet.questions[this.currentIndex];
    let speech = `${this.currentIndex + 1}. ${q.question}. `;
    q.options.forEach((opt: string, index: number) => {
      speech += `${index + 1}: ${opt}. `;
    });
    return speech;
  }

  readCurrentQuestion() {
    if (!this.quizSet) return;
    this.voiceService.speak(this.formatQuestionForSpeech());
  }

  readExplanation(isRight: boolean = true) {
    if (!this.quizSet) return;
    const text = isRight
      ? `That is correct. ${this.quizSet.questions[this.currentIndex].explanation}`
      : `That is incorrect. ${this.quizSet.questions[this.currentIndex].explanation}`;
    this.voiceService.speak(text, () => this.nextQuestion());
  }

  submitAnswerVoice() {
    this.voiceService.listen((heard) => {
      this.processAnswer(heard);
    });
  }

  submitAnswer() {
    window.speechSynthesis.cancel();
    this.processAnswer(this.selectedOption);
  }

  processAnswer(userAnswer: string) {
    const currentQ = this.quizSet.questions[this.currentIndex];
    const spoken = userAnswer.toLowerCase();

    this.aiLessonService.compareTextToEmbedding(spoken, currentQ.answer_embedding!).subscribe(response => {
      const isCorrect = response.match;

      this.isShowingFeedback = true;
      this.cdr.detectChanges();

      this.history.push({
        question: currentQ.question,
        answer: currentQ.answer,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
      });

      this.readExplanation(isCorrect);
    });
  }

  nextQuestion() {
    this.currentIndex++;
    this.selectedOption = '';
    this.isShowingFeedback = false;
    this.cdr.detectChanges();
    if (this.currentIndex < this.quizSet.questions.length) {
      this.readCurrentQuestion();
    }
  }

  navigateToNextPage() {
    const score = this.history.reduce((sum, h) => sum + (h.isCorrect ? 1 : 0), 0);
    const path = this.route.snapshot.queryParams['path'];
    const scoreUpdate: IScoreUpdate = { quiz_score: score };
    this.aiLessonService.updateScores(path, scoreUpdate).subscribe(
      () => {
        this.router.navigate([this.nextPage], { queryParams: { path } });
      },
      (err) => {
        console.error('unable to update quiz score', err);
        this.router.navigate(['/lesson-ai-hierarchy']);
      }
    );
  }
}
