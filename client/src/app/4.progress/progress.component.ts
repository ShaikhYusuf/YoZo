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
import { IProgress } from './progress.model';
import { ProgressService } from './progress.service';

@Component({
  selector: 'app-progress',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css'],
})
export class ProgressComponent implements OnInit {
  schoolId = 0;
  standardId = 0;
  studentId = 0;

  displayedColumns: string[] = [
    'Quiz',
    'FillBlanks',
    'TrueFalse',
    'School',
    'Standard',
    'Subject',
    'Lesson',
    'LessonSection',
    'actions',
  ];
  dataSource: IProgress[] = [];
  isFormVisible = false;
  isEditMode = false;
  currentProgressId: number | null = null;
  progressForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private progressService: ProgressService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.schoolId = +params['schoolId'];
      this.standardId = +params['standardId'];
      this.studentId = +params['studentId'];
      this.loadProgresss();
      this.initForm();
    });
  }

  loadProgresss(): void {
    this.progressService
      .getAllStudent(this.schoolId, this.standardId, this.studentId)
      .subscribe((data) => {
        this.dataSource = data;
      });
  }

  initForm(): void {
    this.progressForm = this.fb.group({
      Id: [null, []],
      quiz: ['', [Validators.required]],
      fillblanks: ['', [Validators.required]],
      truefalse: ['', [Validators.required]],
    });
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
    this.isEditMode = false;
    this.progressForm.reset();
  }

  editProgress(progress: IProgress): void {
    this.isFormVisible = true;
    this.isEditMode = true;
    this.currentProgressId = progress.Id ?? null;
    this.progressForm.patchValue(progress);
  }

  deleteProgress(progressId: number): void {
    this.progressService.delete(progressId).subscribe(() => {
      this.loadProgresss();
    });
  }

  onSubmit(): void {
    if (this.progressForm.valid) {
      const progress = {
        ...this.progressForm.value,
        quiz: Number(this.progressForm.value.quiz),
        fillblanks: Number(this.progressForm.value.fillblanks),
        truefalse: Number(this.progressForm.value.truefalse),
        school: this.schoolId,
        standard: this.standardId,
        student: this.studentId,
      };

      if (this.isEditMode) {
        this.progressService.edit(progress).subscribe(() => {
          this.loadProgresss();
          this.toggleForm();
        });
      } else {
        this.progressService.add(progress).subscribe(() => {
          this.loadProgresss();
          this.toggleForm();
        });
      }
    }
  }

  getErrorMessages(controlName: string): string[] {
    const control = this.progressForm.get(controlName);
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
