import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EvaluationService } from '../evaluation.service';
import { Observable } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';
import { convert } from 'html-to-text';
import { VoiceService } from '../../voice/voice.service';
import { AITaskService } from '../../common/ai-task.service';
import { AuthService } from '../../common/auth.service';
import { SkeletonLoaderComponent } from '../../ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-explanation',
  imports: [
    CommonModule,FormsModule,MarkdownModule,SkeletonLoaderComponent],
  templateUrl: './explanation.component.html',
  styleUrls: ['./explanation.component.css'],
})
export class ExplanationComponent implements OnInit {
  @Input() lessonId!: number;
  @Input() lessonsectionId!: number;
  @Input() explanationText: SafeHtml = 'This is a default explanation.';

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  explanation: string = '';
  activeSubscription: any;

  prompt: string = '';
  responseText: string = ''; // Store accumulated response
  response$?: Observable<string>; // Observable for streaming
  isLoading: boolean = false; // For Chat
  isContentLoading: boolean = false; // For main explanation
  isContentError: boolean = false;
  errorMessage: string = '';
  private currentTaskId: string | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private evaluationService: EvaluationService,
    private voiceService: VoiceService,
    private aiTaskService: AITaskService,
    private authService: AuthService
  ) {}

  get isStudent() {
    return this.authService.user().role === 'student';
  }

  // Load the questions
  private load() {
    this.isContentLoading = true;
    this.isContentError = false;
    this.errorMessage = '';
    this.explanation = '';
    this.explanationText = '';

    this.evaluationService.getLessonExplanation(this.lessonsectionId).subscribe({
      next: (res: any) => {
        if (res.data?.task_id) {
          this.currentTaskId = res.data.task_id;
        }
      },
      error: (err: any) => {
        this.isContentLoading = false;
        this.isContentError = true;
        this.errorMessage = 'Failed to initiate content generation.';
      }
    });
    
    this.aiTaskService.getUpdates().subscribe((update: any) => {
      const isMatch = (this.currentTaskId && update.taskId === this.currentTaskId) || 
                      (update.path.includes('content') && update.path.includes(this.lessonsectionId.toString()));

      if (isMatch) {
        if (update.status === 'completed') {
          this.isContentLoading = false;
          if (update.result) {
            this.explanation = update.result.explanation || '';
            
            let fullContent = `<div>${this.explanation}</div>`;
            
            if (update.result.summary && update.result.summary.length > 0) {
              fullContent += `<div class="mt-4"><h4 class="font-bold text-lg mb-2">Summary</h4><ul class="list-disc pl-5 space-y-1">`;
              update.result.summary.forEach((s: string) => fullContent += `<li>${s}</li>`);
              fullContent += `</ul></div>`;
            }
            
            if (update.result.examples && update.result.examples.length > 0) {
              fullContent += `<div class="mt-4"><h4 class="font-bold text-lg mb-2">Examples</h4><ul class="list-disc pl-5 space-y-1">`;
              update.result.examples.forEach((e: string) => fullContent += `<li>${e}</li>`);
              fullContent += `</ul></div>`;
            }
            
            this.explanationText = this.sanitizer.bypassSecurityTrustHtml(fullContent);
            
            // Auto-trigger speech after a short delay
            setTimeout(() => {
              if (this.explanation && !this.isReading) {
                this.readAloud();
              }
            }, 1000);
          } else {
            this.isContentError = true;
            this.errorMessage = 'Explanation content is empty.';
          }
        } else if (update.status === 'failed') {
          this.isContentLoading = false;
          this.isContentError = true;
          this.errorMessage = update.result?.error?.message || update.error || 'AI Generation failed.';
        }
      }
    });
  }

  retry() {
    this.load();
  }

  ngOnInit() {
    this.load();
    this.listenForChatUpdates();
  }
  ngAfterViewInit() {
    this.scrollToBottom();
  }

  private listenForChatUpdates() {
    this.aiTaskService.getUpdates().subscribe((update: any) => {
      if (update.path.includes('chat') && update.path.includes(this.lessonsectionId.toString())) {
        if (update.status === 'completed' && update.result) {
          this.isLoading = false;
          const result = typeof update.result === 'string' ? JSON.parse(update.result) : update.result;
          const answer = result.answer || result;
          this.responseText += `\n\n**You:** ${this.lastQuestion}\n\n**Assistant:** ${answer}`;
          this.scrollToBottom();
        } else if (update.status === 'failed') {
          this.isLoading = false;
          this.errorMessage = update.error || 'Failed to get a response. Please try again.';
        }
      }
    });
  }

  lastQuestion = '';

  sendQuestion() {
    if (!this.prompt || this.prompt.trim() === '') return;
    this.errorMessage = '';
    this.isLoading = true;
    this.lastQuestion = this.prompt;
    this.evaluationService.sendChat(this.lessonsectionId, this.prompt).subscribe({
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to send question. Please try again.';
        console.error('Chat error:', err);
      }
    });
    this.prompt = '';
  }


  stopResponse() {
    this.isLoading = false;
  }

  isReading = false;
  isPaused = false;

  readAloud() {
    this.isReading = true;
    this.isPaused = false;
    const textToRead = this.convertHtmlToPlainText(this.explanation);
    this.voiceService.speak(textToRead, () => {
      this.isReading = false;
      this.isPaused = false;
    });
  }

  pauseReading() {
    this.isPaused = true;
    this.voiceService.pauseSpeaking();
  }

  resumeReading() {
    this.isPaused = false;
    this.voiceService.resumeSpeaking();
  }

  stopReading() {
    this.voiceService.stopSpeaking();
    this.isReading = false;
    this.isPaused = false;
  }
  
  isListening = false;
  
  startListening() {
    this.isListening = true;
    this.voiceService.listen((text: string) => {
      this.isListening = false;
      if (text) {
        this.prompt = text;
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  private convertHtmlToPlainText(htmlText: string) {
    let plainText = convert(htmlText, {
      wordwrap: 130, // Adjust line breaks for better readability
    });

    plainText = plainText.replace(/[\p{Emoji}\p{Symbol}]/gu, '');

    return plainText;
  }
}
