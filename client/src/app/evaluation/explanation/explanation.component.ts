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

@Component({
  selector: 'app-explanation',
  imports: [
    CommonModule,FormsModule,MarkdownModule],
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
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private sanitizer: DomSanitizer,
    private evaluationService: EvaluationService,
    private voiceService: VoiceService,
    private aiTaskService: AITaskService
  ) {}

  // Load the questions
  private load() {
    this.evaluationService.getLessonExplanation(this.lessonsectionId).subscribe();
    
    this.aiTaskService.getUpdates().subscribe((update: any) => {
      if (update.path.includes('content') && update.path.includes(this.lessonsectionId.toString())) {
        if (update.status === 'completed' && update.result) {
          this.explanation = update.result;
          this.explanationText = this.sanitizer.bypassSecurityTrustHtml(this.explanation);
        }
      }
    });
  }

  ngOnInit() {
    this.load();
  }
  ngAfterViewInit() {
    this.scrollToBottom();
  }

  sendQuestion() {
    this.errorMessage = 'Chat feature coming soon in the next update!';
    // TODO: Implement async chat flow
  }


  stopResponse() {
    this.isLoading = false;
  }

  isReading = false;

  readAloud() {
    this.isReading = true;
    const textToRead = this.convertHtmlToPlainText(this.explanation);
    this.voiceService.speak(textToRead, () => {
      this.isReading = false;
    });
  }

  stopReading() {
    this.voiceService.stopSpeaking();
    this.isReading = false;
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
