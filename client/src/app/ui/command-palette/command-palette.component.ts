import { Component, HostListener, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface CommandItem {
  label: string;
  icon: string;
  route: string;
  category: string;
}

@Component({
  selector: 'ui-command-palette',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './command-palette.component.html',
})
export class CommandPaletteComponent implements AfterViewChecked {
  private router = inject(Router);
  
  isVisible = false;
  searchQuery = '';
  selectedIndex = 0;
  
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  private shouldFocus = false;

  // Pre-defined commands
  allCommands: CommandItem[] = [
    { label: 'Go to Dashboard', icon: 'fa-table-columns', route: '/school-dashboard', category: 'Navigation' },
    { label: 'Manage Colleges', icon: 'fa-building-columns', route: '/school', category: 'Navigation' },
    { label: 'Manage Users', icon: 'fa-users', route: '/login-details', category: 'Navigation' },
    { label: 'View Profile', icon: 'fa-id-badge', route: '/profile', category: 'Personal' },
    { label: 'Voice Settings', icon: 'fa-microphone-lines', route: '/voice-settings', category: 'System' },
    { label: 'Log Out', icon: 'fa-arrow-right-from-bracket', route: '/', category: 'System' },
  ];

  get filteredCommands(): CommandItem[] {
    if (!this.searchQuery.trim()) {
      return this.allCommands;
    }
    const query = this.searchQuery.toLowerCase();
    return this.allCommands.filter(cmd => 
      cmd.label.toLowerCase().includes(query) || 
      cmd.category.toLowerCase().includes(query)
    );
  }

  ngAfterViewChecked() {
    if (this.shouldFocus && this.searchInput) {
      this.searchInput.nativeElement.focus();
      this.shouldFocus = false;
    }
  }

  @HostListener('window:keydown.control.k', ['$event'])
  @HostListener('window:keydown.meta.k', ['$event'])
  openPalette(event: Event) {
    event.preventDefault(); // Prevent browser default (e.g. Chrome search box)
    if (!this.isVisible) {
      this.isVisible = true;
      this.searchQuery = '';
      this.selectedIndex = 0;
      this.shouldFocus = true;
    } else {
      this.closePalette();
    }
  }

  @HostListener('window:keydown.escape')
  closeOnEscape() {
    if (this.isVisible) {
      this.closePalette();
    }
  }

  @HostListener('window:keydown.arrowdown', ['$event'])
  onArrowDown(event: Event) {
    if (!this.isVisible) return;
    event.preventDefault();
    if (this.selectedIndex < this.filteredCommands.length - 1) {
      this.selectedIndex++;
    } else {
      this.selectedIndex = 0; // wrap around
    }
  }

  @HostListener('window:keydown.arrowup', ['$event'])
  onArrowUp(event: Event) {
    if (!this.isVisible) return;
    event.preventDefault();
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
    } else {
      this.selectedIndex = this.filteredCommands.length - 1; // wrap around
    }
  }

  @HostListener('window:keydown.enter', ['$event'])
  onEnter(event: Event) {
    if (!this.isVisible) return;
    event.preventDefault();
    const items = this.filteredCommands;
    if (items.length > 0 && items[this.selectedIndex]) {
      this.executeCommand(items[this.selectedIndex]);
    }
  }

  closePalette() {
    this.isVisible = false;
  }

  executeCommand(command: CommandItem) {
    this.closePalette();
    if (command.label === 'Log Out') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
    this.router.navigate([command.route]);
  }
}
