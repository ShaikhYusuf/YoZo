import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ILesson } from './lesson.model';
import { LessonService } from './lesson.service';

@Component({
  selector: 'app-lesson',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './lesson.component.html',
  styleUrls: ['./lesson.component.css'],
})
export class LessonComponent implements OnInit {
  subjectId = 0;

  displayedColumns: string[] = ['name', 'actions'];
  dataSource: ILesson[] = [];
  isFormVisible = false;
  isEditMode = false;
  currentLessonId: number | null = null;
  lessonForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private lessonService: LessonService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.subjectId = +params['subjectId'];
      this.loadLessons();
      this.initForm();
    });
  }

  loadLessons(): void {
    this.lessonService.getAll(this.subjectId).subscribe((data) => {
      this.dataSource = data;
    });
  }

  initForm(): void {
    this.lessonForm = this.fb.group({
      Id: [null, []],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(255),
          Validators.pattern('^[A-Za-z0-9 .,\-]+$'),
        ],
      ],
    });
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
    this.isEditMode = false;
    this.lessonForm.reset();
  }

  editLesson(lesson: ILesson): void {
    this.isFormVisible = true;
    this.isEditMode = true;
    this.currentLessonId = lesson.Id ?? null;
    this.lessonForm.patchValue(lesson);
  }

  deleteLesson(lessonId: number): void {
    this.lessonService.delete(lessonId).subscribe(() => {
      this.loadLessons();
    });
  }

  onLessonSections(lessonId: number) {
    this.router.navigate([
      'lessonsection/subject',
      this.subjectId,
      'lesson',
      lessonId,
    ]);
  }

  onSubmit(): void {
    if (this.lessonForm.valid) {
      const lesson = { ...this.lessonForm.value, subject: this.subjectId };

      if (this.isEditMode) {
        this.lessonService.edit(lesson).subscribe(() => {
          this.loadLessons();
          this.toggleForm();
        });
      } else {
        this.lessonService.add(lesson).subscribe(() => {
          this.loadLessons();
          this.toggleForm();
        });
      }
    }
  }

  getErrorMessages(controlName: string): string[] {
    const control = this.lessonForm.get(controlName);
    if (control?.touched && control?.invalid) {
      const errors: { [key: string]: string } = {
        required: 'This field is required.',
        minlength: 'Too short.',
        maxlength: 'Too long.',
        pattern: 'Invalid format.',
      };
      return Object.keys(control.errors || {}).map((key) => errors[key]);
    }
    return [];
  }
}
