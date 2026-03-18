import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AiLessonService } from '../ai-lesson.service';
import { VoiceService } from '../../voice/voice.service';
import { IScoreUpdate, IShortQuestionSet } from '../lesson-ai.model';


@Component({
  selector: 'app-ai-lesson-shortquestion',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, MatInputModule, MatButtonModule, MatCardModule, MatFormFieldModule],
  templateUrl: './lesson-shortquestion.component.html',
  styleUrls: ['./lesson-shortquestion.component.css'],
})
export class AiLessonShortQuestionComponent implements OnInit {
  sqSet!: IShortQuestionSet;
  currentIndex = 0;
  userAnswer: string = '';
  history: { question: string; answer: string; userAnswer: string; isCorrect: boolean }[] = [];
  isShowingFeedback = false;
  nextPage: string = '/lesson-ai-hierarchy';

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
    this.nextPage = this.route.snapshot.queryParams['next'] || '/lesson-ai-hierarchy';
    this.aiLessonService.getLessonShortQuestions(path).subscribe((data: IShortQuestionSet) => {
      this.sqSet = data;
      this.readCurrentQuestion();
      this.history = [];
    });
  }

  readCurrentQuestion() {
    if (!this.sqSet) return;
    const text = this.sqSet.questions[this.currentIndex].question;
    this.voiceService.speak(text);
  }

  submitAnswerVoice() {
    this.voiceService.listen((heard) => {
      this.processAnswer(heard);
    });
  }

  submitAnswer() {
    window.speechSynthesis.cancel();
    this.processAnswer(this.userAnswer);
  }

  processAnswer(userAnswer: string) {
    const currentQ = this.sqSet.questions[this.currentIndex];
    const spoken = userAnswer;

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

      const feedback = isCorrect
        ? `That is correct. The answer is, ${currentQ.answer}`
        : `That is incorrect. The answer is, ${currentQ.answer}`;
      this.voiceService.speak(feedback, () => this.nextQuestion());
    });
  }

  nextQuestion() {
    this.currentIndex++;
    this.userAnswer = '';
    this.isShowingFeedback = false;
    this.cdr.detectChanges();
    if (this.currentIndex < this.sqSet.questions.length) {
      this.readCurrentQuestion();
    }
  }

  navigateToNextPage() {
    const score = this.history.reduce((sum, h) => sum + (h.isCorrect ? 1 : 0), 0);
    const path = this.route.snapshot.queryParams['path'];
    const scoreUpdate: IScoreUpdate = { shortquestion_score: score };
    this.aiLessonService.updateScores(path, scoreUpdate).subscribe(
      () => {
        this.router.navigate([this.nextPage], { queryParams: { path } });
      },
      (err) => {
        console.error('unable to update short question score', err);
        this.router.navigate(['/lesson-ai-hierarchy']);
      }
    );
  }
}
