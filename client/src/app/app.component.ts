import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingService } from './common/loading.service';
import { SidebarComponent, CommandPaletteComponent, LoadingOverlayComponent, WaveformComponent } from './ui';
import { VoiceService } from './voice/voice.service';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, SidebarComponent, CommandPaletteComponent, LoadingOverlayComponent, WaveformComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'YoZo Platform';
  loadingService = inject(LoadingService);
  voiceService = inject(VoiceService);
  private router = inject(Router);

  // Determine if we should show the layout (hide on login screen)
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  get isAuthScreen(): boolean {
    const url = this.currentUrl();
    // Hide sidebar on root login page
    return !url || url === '/';
  }
}
