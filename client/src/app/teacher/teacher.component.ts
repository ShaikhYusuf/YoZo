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
import { ITeacher } from './teacher.model';
import { TeacherService } from './teacher.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Location } from '@angular/common';

@Component({
  selector: 'app-teacher',
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
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.css'],
})
export class TeacherComponent implements OnInit {
  schoolId = 0;
  standardId = 0;

  displayedColumns: string[] = ['name', 'adhaar', 'actions'];
  dataSource: ITeacher[] = [];
  isFormVisible = false;
  isEditMode = false;
  currentTeacherId: number | null = null;
  teacherForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService,
    private location: Location
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.schoolId = +params['schoolId'];
      this.standardId = +params['standardId'];
      this.loadTeachers();
      this.initForm();
    });
  }

  loadTeachers(): void {
    this.teacherService
      .getAll(this.schoolId, this.standardId)
      .subscribe((data) => {
        this.dataSource = data;
      });
  }

  initForm(): void {
    this.teacherForm = this.fb.group({
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
    this.teacherForm.reset();
  }

  editTeacher(teacher: ITeacher): void {
    this.isFormVisible = true;
    this.isEditMode = true;
    this.currentTeacherId = teacher.Id ?? null;
    this.teacherForm.patchValue(teacher);
  }

  deleteTeacher(teacherId: number): void {
    this.teacherService.delete(teacherId).subscribe(() => {
      this.loadTeachers();
    });
  }

  onSubmit(): void {
    if (this.teacherForm.valid) {
      const teacher = {
        ...this.teacherForm.value,
        school: this.schoolId,
        standard: this.standardId,
      };

      if (this.isEditMode) {
        this.teacherService.edit(teacher).subscribe(() => {
          this.loadTeachers();
          this.toggleForm();
        });
      } else {
        this.teacherService.add(teacher).subscribe(() => {
          this.loadTeachers();
          this.toggleForm();
        });
      }
    }
  }

  getErrorMessages(controlName: string): string[] {
    const control = this.teacherForm.get(controlName);
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
