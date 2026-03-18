import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationStart, RouterModule } from '@angular/router';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';
import { ILessonHierarchy } from '../lesson-ai.model';
import { AiLessonService } from '../ai-lesson.service';
import { VoiceService } from '../../voice/voice.service';


@Component({
  selector: 'app-ai-lesson-hierarchy',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatExpansionModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
  ],
  templateUrl: './lesson-hierarchy.component.html',
  styleUrls: ['./lesson-hierarchy.component.css'],
})
export class AiLessonHierarchyComponent implements OnInit {

  hierarchy: ILessonHierarchy[] = [];
  topics: ILessonHierarchy[] = [];
  lessons: ILessonHierarchy[] = [];

  constructor(
    private router: Router,
    private voiceService: VoiceService,
    private aiLessonService: AiLessonService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.voiceService.stopSpeaking();
      }
    });
  }

  ngOnInit(): void {
    this.loadHierarchy();
  }

  loadHierarchy() {
    this.aiLessonService.getLessonHierarchy().subscribe((data: ILessonHierarchy[]) => {
      this.hierarchy = data;
      this.topics = data.filter(x => x.parent_path === null);
      this.lessons = data.filter(x => x.parent_path !== null);
    });
  }

  getLessons(topicPath: string) {
    return this.lessons.filter(l => l.parent_path === topicPath);
  }

  openLesson(path: string) {
    this.router.navigate(['/lesson-ai-content'], {
      queryParams: { path: path, next: '/lesson-ai-quiz' },
    });
  }

  openRoute(path: string, currentRoute: string) {
    this.router.navigate([currentRoute], {
      queryParams: { path: path, next: '/lesson-ai-hierarchy' },
    });
  }
}
