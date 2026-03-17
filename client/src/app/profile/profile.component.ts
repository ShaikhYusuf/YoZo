import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  
  ngOnInit(): void {
    // Ideally fetch standard profile info from auth service
  }
}
