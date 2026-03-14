import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ILoginDetail, roleList } from './logindetail.model';
import { LoginDetailService } from './logindetail.service';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-logindetail',
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
  templateUrl: './logindetail.component.html',
  styleUrls: ['./logindetail.component.css'],
})
export class LoginDetailComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'adhaar',
    'password',
    'role',
    'actions',
  ];
  dataSource: ILoginDetail[] = [];
  isFormVisible = false;
  isEditMode = false;
  currentLoginDetailId: number | null = null;
  logindetailForm!: FormGroup;
  roleInformation = [...roleList];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private logindetailService: LoginDetailService
  ) {}

  ngOnInit(): void {
    this.loadLoginDetails();
    this.initForm();
  }

  loadLoginDetails(): void {
    this.logindetailService.getAll().subscribe((data) => {
      this.dataSource = data;
    });
  }

  initForm(): void {
    this.logindetailForm = this.fb.group({
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
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(128),
          Validators.pattern(/^[A-Za-z0-9'.\-, ]+$/),
        ],
      ],
      role: [
        '',
        [
          Validators.required,
          (control: any) => {
            return this.roleInformation.includes(
              control.value?.toLowerCase().trim()
            )
              ? null
              : { invalidData: true };
          },
        ],
      ],
    });
  }

  toggleForm(): void {
    this.isFormVisible = !this.isFormVisible;
    this.isEditMode = false;
    this.logindetailForm.reset();
  }

  editLoginDetail(logindetail: ILoginDetail): void {
    this.isFormVisible = true;
    this.isEditMode = true;
    this.currentLoginDetailId = logindetail.Id ?? null;
    this.logindetailForm.patchValue(logindetail);
  }

  deleteLoginDetail(logindetailId: number): void {
    this.logindetailService.delete(logindetailId).subscribe(() => {
      this.loadLoginDetails();
    });
  }

  onSubmit(): void {
    if (this.logindetailForm.valid) {
      const logindetail = { ...this.logindetailForm.value };

      if (this.isEditMode) {
        this.logindetailService.edit(logindetail).subscribe(() => {
          this.loadLoginDetails();
          this.toggleForm();
        });
      } else {
        this.logindetailService.add(logindetail).subscribe(() => {
          this.loadLoginDetails();
          this.toggleForm();
        });
      }
    }
  }

  getErrorMessages(controlName: string): string[] {
    const control = this.logindetailForm.get(controlName);
    if (control?.touched && control?.invalid) {
      const errors: { [key: string]: string } = {
        required: 'This field is required.',
        minlength: 'Too short.',
        maxlength: 'Too long.',
        pattern: 'Invalid format.',
        invalidData: 'invalidData',
      };
      return Object.keys(control.errors || {}).map((key) => errors[key]);
    }
    return [];
  }
}
