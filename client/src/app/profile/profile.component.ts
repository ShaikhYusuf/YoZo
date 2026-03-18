import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../common/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userRole = 'Student';
  userName = 'John Doe';
  userEmail = 'john.doe@example.com';
  
  private authService = inject(AuthService);

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.userRole = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Guest';
      this.userName = user.name || 'Unknown User';
      this.userEmail = user.username ? `${user.username}@yozo.edu` : 'No email provided'; // Fallback using username
    }
  }
}
