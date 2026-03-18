import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AiLessonService } from '../ai-lesson.service';
import { VoiceService } from '../../voice/voice.service';
import { ILessonContent } from '../lesson-ai.model';


@Component({
  selector: 'app-ai-lesson-content',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './lesson-content.component.html',
  styleUrls: ['./lesson-content.component.css'],
})
export class AiLessonContentComponent implements OnInit {
  content!: ILessonContent;
  nextPage: string = '/lesson-ai-quiz';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private aiLessonService: AiLessonService,
    private voiceService: VoiceService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.voiceService.stopSpeaking();
      }
    });
  }

  ngOnInit() {
    const path = this.route.snapshot.queryParams['path'];
    this.nextPage = this.route.snapshot.queryParams['next'] || '/lesson-ai-quiz';
    this.aiLessonService.getLessonContent(path).subscribe((data: ILessonContent) => {
      this.content = data;
      this.readContent();
    });
  }

  readContent() {
    if (!this.content) return;
    this.voiceService.speak(this.content.explanation, () => {
      this.voiceService.speak(this.content.examples.join('\n'));
    });
  }

  navigateToNextPage() {
    const path = this.route.snapshot.queryParams['path'];
    this.router.navigate([this.nextPage], { queryParams: { path } });
  }
}
