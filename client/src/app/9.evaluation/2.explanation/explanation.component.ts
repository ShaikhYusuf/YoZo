import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EvaluationService } from '../evaluation.service';
import { Observable } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';
import { convert } from 'html-to-text';
import { VoiceService } from '../../10.voice/voice.service';

@Component({
  selector: 'app-explanation',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MarkdownModule,
  ],
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
    private voiceService: VoiceService
  ) {}

  // Load the questions
  private load() {
    this.activeSubscription = this.evaluationService
      .getLessonExplanation(this.lessonsectionId)
      .subscribe((data) => {
        this.explanation = data;
        this.explanationText = this.sanitizer.bypassSecurityTrustHtml(
          this.explanation
        );
      });
  }

  ngOnInit() {
    this.load();
  }
  ngAfterViewInit() {
    this.scrollToBottom();
  }

  sendQuestion() {
    if (!this.prompt.trim()) {
      this.errorMessage = 'Please enter a prompt.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    let textExplanation = this.convertHtmlToPlainText(this.explanation);

    let modifiedPrompt =
      //`The context is: \n ${textExplanation}.\n\n
      `Use only brief answer unless asked explicitly to explain in detail.
    Be crisp and clear. Answer the question within the context only. \n\n The question is: ${this.prompt}.
    Else simply mention 'You are asking question outside the context'
    `;
    this.response$ = this.evaluationService.generateResponse(modifiedPrompt);
    this.response$.subscribe(
      (chunk) => {
        this.responseText += chunk;
        this.scrollToBottom();
      },
      (error) => {
        this.errorMessage = 'Error fetching response. Please try again.';
        console.error('Error:', error);
      },
      () => {
        this.responseText += '\n\n\n';
        this.prompt = '';
        this.isLoading = false;
      }
    );
  }

  stopResponse() {
    this.evaluationService.stopGeneration();
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
