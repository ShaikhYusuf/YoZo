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
import { IStudent } from './student.model';
import { StudentService } from './student.service';
  import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-student',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
      MatTooltipModule,
  ],
  templateUrl: './student.component.html',
  styleUrls: ['./student.component.css'],
})
export class StudentComponent implements OnInit {
  schoolId = 0;
  standardId = 0;

  displayedColumns: string[] = ['name', 'adhaar', 'actions'];
  dataSource: IStudent[] = [];
  isFormVisible = false;
  isEditMode = false;
  currentStudentId: number | null = null;
  studentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.schoolId = +params['schoolId'];
      this.standardId = +params['standardId'];
      this.loadStudents();
      this.initForm();
    });
  }

  loadStudents(): void {
    this.studentService
      .getAll(this.schoolId, this.standardId)
      .subscribe((data) => {
        this.dataSource = data;
      });
  }

  initForm(): void {
    this.studentForm = this.fb.group({
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
      adhaar: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{4}-[0-9]{4}-[0-9]{4}$'),
        ],
      ],
    });
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
    this.isEditMode = false;
    this.studentForm.reset();
  }

  editStudent(student: IStudent): void {
    this.isFormVisible = true;
    this.isEditMode = true;
    this.currentStudentId = student.Id ?? null;
    this.studentForm.patchValue(student);
  }

  deleteStudent(studentId: number): void {
    this.studentService.delete(studentId).subscribe(() => {
      this.loadStudents();
    });
  }

  onProgresss(studentId: number) {
    this.router.navigate([
      '/progress/school',
      this.schoolId,
      'standard',
      this.standardId,
      'student',
      studentId,
    ]);
  }

  onSubmit(): void {
    if (this.studentForm.valid) {
      const student = {
        ...this.studentForm.value,
        school: this.schoolId,
        standard: this.standardId,
      };

      if (this.isEditMode) {
        this.studentService.edit(student).subscribe(() => {
          this.loadStudents();
          this.toggleForm();
        });
      } else {
        this.studentService.add(student).subscribe(() => {
          this.loadStudents();
          this.toggleForm();
        });
      }
    }
  }

  getErrorMessages(controlName: string): string[] {
    const control = this.studentForm.get(controlName);
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
