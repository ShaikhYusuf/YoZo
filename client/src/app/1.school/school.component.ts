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
import { ISchool } from './school.model';
import { SchoolService } from './school.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-school',
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
  templateUrl: './school.component.html',
  styleUrls: ['./school.component.css'],
})
export class SchoolComponent implements OnInit {
  displayedColumns: string[] = ['name', 'address', 'actions'];
  dataSource: ISchool[] = [];
  isFormVisible = false;
  isEditMode = false;
  currentSchoolId: number | null = null;
  schoolForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private schoolService: SchoolService
  ) {}

  ngOnInit(): void {
    this.loadSchools();
    this.initForm();
  }

  loadSchools(): void {
    this.schoolService.getAll().subscribe((data) => {
      this.dataSource = data;
    });
  }

  initForm(): void {
    this.schoolForm = this.fb.group({
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
      address: [
        '',
        [
          Validators.required,
          Validators.minLength(16),
          Validators.maxLength(255),
          Validators.pattern(/^[A-Za-z0-9'.\-, ]*$/),
        ],
      ],
    });
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
    this.isEditMode = false;
    this.schoolForm.reset();
  }

  editSchool(school: ISchool): void {
    this.isFormVisible = true;
    this.isEditMode = true;
    this.currentSchoolId = school.Id ?? null;
    this.schoolForm.patchValue(school);
  }

  deleteSchool(schoolId: number): void {
    this.schoolService.delete(schoolId).subscribe(() => {
      this.loadSchools();
    });
  }

  onSchoolStandards(schoolId: number) {
    this.router.navigate(['schoolstandard/school', schoolId]);
  }

  onSubmit(): void {
    if (this.schoolForm.valid) {
      const school = { ...this.schoolForm.value };

      if (this.isEditMode) {
        this.schoolService.edit(school).subscribe(() => {
          this.loadSchools();
          this.toggleForm();
        });
      } else {
        this.schoolService.add(school).subscribe(() => {
          this.loadSchools();
          this.toggleForm();
        });
      }
    }
  }

  getErrorMessages(controlName: string): string[] {
    const control = this.schoolForm.get(controlName);
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
