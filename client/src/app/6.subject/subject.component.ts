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
import { ISubject } from './subject.model';
import { SubjectService } from './subject.service';

@Component({
  selector: 'app-subject',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './subject.component.html',
  styleUrls: ['./subject.component.css'],
})
export class SubjectComponent implements OnInit {
  standardId = 0;

  displayedColumns: string[] = ['name', 'actions'];
  dataSource: ISubject[] = [];
  isFormVisible = false;
  isEditMode = false;
  currentSubjectId: number | null = null;
  subjectForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private subjectService: SubjectService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.standardId = +params['standardId'];
      this.loadSubjects();
      this.initForm();
    });
  }

  loadSubjects(): void {
    this.subjectService.getAll(this.standardId).subscribe((data) => {
      this.dataSource = data;
    });
  }

  initForm(): void {
    this.subjectForm = this.fb.group({
      Id: [null, []],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(255),
          Validators.pattern('^[A-Za-z ]+$'),
        ],
      ],
    });
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
    this.isEditMode = false;
    this.subjectForm.reset();
  }

  editSubject(subject: ISubject): void {
    this.isFormVisible = true;
    this.isEditMode = true;
    this.currentSubjectId = subject.Id ?? null;
    this.subjectForm.patchValue(subject);
  }

  deleteSubject(subjectId: number): void {
    this.subjectService.delete(subjectId).subscribe(() => {
      this.loadSubjects();
    });
  }

  onLessons(subjectId: number) {
    this.router.navigate(['lesson/subject', subjectId]);
  }

  onSubmit(): void {
    if (this.subjectForm.valid) {
      const subject = { ...this.subjectForm.value, standard: this.standardId };

      if (this.isEditMode) {
        this.subjectService.edit(subject).subscribe(() => {
          this.loadSubjects();
          this.toggleForm();
        });
      } else {
        this.subjectService.add(subject).subscribe(() => {
          this.loadSubjects();
          this.toggleForm();
        });
      }
    }
  }

  getErrorMessages(controlName: string): string[] {
    const control = this.subjectForm.get(controlName);
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
