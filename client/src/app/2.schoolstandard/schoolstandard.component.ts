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
import { MatOptionModule } from '@angular/material/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ISchoolStandard } from './schoolstandard.model';
import { SchoolStandardService } from './schoolstandard.service';
import { StandardService } from '../5.standard/standard.service';
import { IStandard } from '../5.standard/standard.model';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-schoolstandard',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
  ],
  templateUrl: './schoolstandard.component.html',
  styleUrls: ['./schoolstandard.component.css'],
})
export class SchoolStandardComponent implements OnInit {
  schoolId = 0;
  standard = 0;
  standardList: IStandard[] = [];

  displayedColumns: string[] = ['name', 'actions'];
  dataSource: ISchoolStandard[] = [];
  isFormVisible = false;
  //isEditMode = false;
  currentSchoolStandardId: number | null = null;
  schoolstandardForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private schoolstandardService: SchoolStandardService,
    private standardService: StandardService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.schoolId = +params['schoolId'];
      this.loadSchoolStandards();
      this.initForm();
    });
  }

  loadSchoolStandards(): void {
    forkJoin({
      standardList: this.standardService.getAll(),
      dataSource: this.schoolstandardService.getAll(this.schoolId),
    }).subscribe(({ standardList, dataSource }) => {
      this.standardList = standardList;
      this.dataSource = dataSource;

      this.dataSource = dataSource.map((item) => {
        const standard = this.standardList.find(
          (eachStandard) => eachStandard.Id === item.standard
        );
        return {
          ...item,
          name: standard ? standard.name : '', // Retain existing name if no match found
        };
      });
    });
  }

  initForm(): void {
    this.schoolstandardForm = this.fb.group({
      Id: [null, []],
      standard: [null, []], // Add this line for standard selection
    });
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
    //this.isEditMode = false;
    this.schoolstandardForm.reset();
  }

  // editSchoolStandard(schoolstandardId: ISchoolStandard): void {
  //   this.isFormVisible = true;
  //   this.isEditMode = true;
  //   this.currentSchoolStandardId = schoolstandardId.Id ?? null;
  //   this.schoolstandardForm.patchValue(schoolstandardId);
  // }

  deleteSchoolStandard(schoolstandardId: number): void {
    this.schoolstandardService.delete(schoolstandardId).subscribe(() => {
      this.loadSchoolStandards();
    });
  }

  onStudents(schoolstandardId: number, standardId: number) {
    this.router.navigate([
      'student/school',
      this.schoolId,
      'standard',
      standardId,
    ]);
  }

  onSubmit(): void {
    if (this.schoolstandardForm.valid) {
      const schoolstandard = {
        ...this.schoolstandardForm.value,
        school: this.schoolId,
      };

      this.schoolstandardService.add(schoolstandard).subscribe(() => {
        this.loadSchoolStandards();
        this.toggleForm();
      });
    }
  }

  getErrorMessages(controlName: string): string[] {
    const control = this.schoolstandardForm.get(controlName);
    if (control?.touched && control?.invalid) {
      const errors: { [key: string]: string } = {
        required: 'This field is required.',
        minlength: 'Too short.',
        maxlength: 'Too long.',
        pattern: 'Invalid format.',
      };

      // Handle specific error messages for the 'standard' control
      if (
        controlName === 'standard' &&
        control.errors &&
        control.errors['required']
      ) {
        return ['Standard selection is required.'];
      }

      return Object.keys(control.errors || {}).map((key) => errors[key]);
    }
    return [];
  }
}
