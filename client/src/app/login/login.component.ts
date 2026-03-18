import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from './login.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../common/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private loginService: LoginService,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { username, password } = this.loginForm.value;

    this.loginService.validate(username, password).subscribe({
      next: (userInfo) => {
        if (userInfo) {
          if (userInfo.role === 'admin') {
            this.authService.setUser(userInfo);
            this.router.navigate(['admin']);
          } else if (userInfo.role === 'teacher' || userInfo.role === 'principal') {
            this.authService.setUser(userInfo);
            this.router.navigate(['school-dashboard']);
          } else if (userInfo.role === 'student') {
            this.loginService.getByUsername(userInfo.username).subscribe({
              next: (student) => {
                this.authService.setUser(userInfo, student);
                this.router.navigate([
                  'student-dashboard',
                  'school',
                  student.school,
                  'standard',
                  student.standard,
                  'student',
                  student.Id,
                ]);
              },
              error: () => {
                this.isLoading = false;
                this.errorMessage = 'Could not load student profile. Please try again.';
              },
            });
            return;
          }
        } else {
          this.errorMessage = 'Invalid username or password';
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Login failed. Please check your credentials and try again.';
      },
    });
  }
}
