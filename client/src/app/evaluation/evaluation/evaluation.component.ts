import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExplanationComponent } from '../explanation/explanation.component';
import { FillBlankComponent } from '../fillblank/fillblank.component';
import { QuizComponent } from '../quiz/quiz.component';
import { TrueFalseComponent } from '../truefalse/truefalse.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressService } from '../../progress/progress.service';

@Component({
  selector: 'app-evaluation',
  imports: [
    CommonModule,FormsModule,ExplanationComponent,
    FillBlankComponent,
    QuizComponent,
    TrueFalseComponent],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.css'],
})
export class EvaluationComponent {
  schoolId = 1;
  standardId = 1;
  studentId = 1;
  subjectId = 1;
  lessonId = 1;
  lessonsectionId = 1;

  steps = ['Explanation', 'Quiz', 'TrueFalse', 'FillBlank'];
  currentStep = 0;
  progress = 0;

  quizScore = 0;
  trueFalseScore = 0;
  fillBlankScore = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private progressService: ProgressService
  ) {
    this.route.params.subscribe((params) => {
      this.schoolId = +params['schoolId'];
      this.standardId = +params['standardId'];
      this.studentId = +params['studentId'];
      this.subjectId = +params['subjectId'];
      this.lessonId = +params['lessonId'];
      this.lessonsectionId = +params['lessonsectionId'];
    });
  }

  doneStep() {
    this.progressService
      .add({
        quiz: this.quizScore,
        fillblanks: this.fillBlankScore,
        truefalse: this.trueFalseScore,
        school: this.schoolId,
        standard: this.standardId,
        student: this.studentId,
        subject: this.subjectId,
        lesson: this.lessonId,
        lessonsection: this.lessonsectionId,
      })
      .subscribe((data) => {
        this.router.navigate([
          'student-dashboard',
          'school',
          this.schoolId,
          'standard',
          this.standardId,
          'student',
          this.studentId]);
      });
  }
  nextStep() {
    if (this.currentStep === 0) {
      this.currentStep++;
      this.updateProgress();
    } else if (this.currentStep === 1 && this.quizScore >= 90) {
      this.currentStep++;
      this.updateProgress();
    } else if (this.currentStep === 2 && this.trueFalseScore >= 90) {
      this.currentStep++;
      this.updateProgress();
    } else if (this.currentStep === 3 && this.fillBlankScore >= 90) {
      this.currentStep++;
      this.updateProgress();
    } else {
      //do nothing
    }

    if (this.progress == 100) {
      this.doneStep();

      this.router.navigate([
        'student-dashboard',
        'school',
        this.schoolId,
        'standard',
        this.standardId,
        'student',
        this.studentId]);
    }
  }

  updateProgress() {
    this.progress = (this.currentStep / this.steps.length) * 100;
  }

  updateScore(component: string, score: number) {
    if (component === 'Quiz') {
      this.quizScore = score;
      this.nextStep();
    } else if (component === 'TrueFalse') {
      this.trueFalseScore = score;
      this.nextStep();
    } else if (component === 'FillBlank') {
      this.fillBlankScore = score;
      this.nextStep();
    }
  }
}
