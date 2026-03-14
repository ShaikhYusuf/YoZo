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
import { IStandard } from './standard.model';
import { StandardService } from './standard.service';

@Component({
  selector: 'app-standard',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './standard.component.html',
  styleUrls: ['./standard.component.css'],
})
export class StandardComponent implements OnInit {
  displayedColumns: string[] = ['name', 'actions'];
  dataSource: IStandard[] = [];
  isFormVisible = false;
  isEditMode = false;
  currentStandardId: number | null = null;
  standardForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private standardService: StandardService
  ) {}

  ngOnInit(): void {
    this.loadStandards();
    this.initForm();
  }

  loadStandards(): void {
    this.standardService.getAll().subscribe((data) => {
      this.dataSource = data;
    });
  }

  initForm(): void {
    this.standardForm = this.fb.group({
      Id: [null, []],
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(255),
          Validators.pattern('^[0-9A-Za-z ]+$'),
        ],
      ],
    });
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
    this.isEditMode = false;
    this.standardForm.reset();
  }

  editStandard(standard: IStandard): void {
    this.isFormVisible = true;
    this.isEditMode = true;
    this.currentStandardId = standard.Id ?? null;
    this.standardForm.patchValue(standard);
  }

  deleteStandard(standardId: number): void {
    this.standardService.delete(standardId).subscribe(() => {
      this.loadStandards();
    });
  }

  onSubjects(standardId: number) {
    this.router.navigate(['subject/standard', standardId]);
  }

  onSubmit(): void {
    if (this.standardForm.valid) {
      const standard = { ...this.standardForm.value };

      if (this.isEditMode) {
        this.standardService.edit(standard).subscribe(() => {
          this.loadStandards();
          this.toggleForm();
        });
      } else {
        this.standardService.add(standard).subscribe(() => {
          this.loadStandards();
          this.toggleForm();
        });
      }
    }
  }

  getErrorMessages(controlName: string): string[] {
    const control = this.standardForm.get(controlName);
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
