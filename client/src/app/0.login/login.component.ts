import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from './login.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private loginService: LoginService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    const { username, password } = this.loginForm.value;
    this.loginService.validate(username, password).subscribe((userInfo) => {
      if (userInfo) {
        if (userInfo?.role == 'admin') {
          this.router.navigate(['admin']);
        } else if (
          userInfo?.role == 'teacher' ||
          userInfo?.role == 'principal'
        ) {
          this.router.navigate(['school-dashboard']);
        } else if (userInfo?.role == 'student') {
          this.loginService
            .getByAdhaar(userInfo.adhaar)
            .subscribe((student) => {
              this.router.navigate([
                'student-dashboard',
                'school',
                student.school,
                'standard',
                student.standard,
                'student',
                student.Id,
              ]);
            });
        }
      } else {
        this.errorMessage = 'Invalid username or password';
      }
    });
  }
}
