import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit, OnDestroy {

  // Navbar state
  isScrolled = false;
  mobileMenuOpen = false;

  // Typewriter
  typewriterPhrases: string[] = [
    'AI-Powered Learning 🤖',
    'Mastery-Based Education 📚',
    'Smart Progress Tracking 📊',
    'Anti-Cheating Exams 🛡️',
    'Voice Doubt Bot 🎙️',
  ];
  currentFeature = 0;
  currentText = '';
  deleting = false;
  private typewriterInterval: any;

  // FAQ
  openFaq: number | null = null;

  // Screenshot tabs
  activeTab = 0;

  // -------- DATA --------

  mockSubjects = [
    { icon: '📐', name: 'Mathematics', progress: 78, color: '#6366f1' },
    { icon: '🔬', name: 'Science', progress: 65, color: '#10b981' },
    { icon: '📖', name: 'English', progress: 90, color: '#f59e0b' },
    { icon: '🌍', name: 'History', progress: 45, color: '#ef4444' },
  ];

  problems = [
    { icon: '🧠', title: 'Rote Memorization', desc: 'Students memorize answers without understanding the actual concepts behind them.' },
    {
      icon: '👩‍🏫', title: 'No Progress Visibility', desc: 'Teachers cannot effectively track each individual student\'s learning progress.'
    },
    { icon: '📋', title: 'Same Question Papers', desc: 'Identical papers across the class make cheating easy and evaluation unfair.' },
    {
      icon: '🔁', title: 'No Revision System', desc: 'Students don\'t revisit past topics, leading to knowledge gaps over time.'
    },
    { icon: '💬', title: 'Doubts Go Unanswered', desc: 'Students hesitate to ask questions in class and have no after-hours support.' },
    { icon: '📉', title: 'Generic Learning Pace', desc: 'One-size-fits-all teaching doesn\'t work for diverse classrooms.' },
  ];

  features = [
    {
      icon: '🤖', bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05))', title: 'AI Learning System',
      desc: 'Step-by-step topic mastery with smart explanations and adaptive quizzes.',
      bullets: ['Topic-by-topic progression', 'Explanation + quiz based learning', 'Unlock next topic on mastery']
    },
    {
      icon: '📊', bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))', title: 'Smart Progress Tracking',
      desc: 'Detailed real-time dashboards for teachers, students, and school admins.',
      bullets: ['Overall school progress', 'Subject-wise analytics', 'Individual student reports']
    },
    {
      icon: '📝', bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))', title: 'AI Generated Notes',
      desc: 'Students receive downloadable, auto-generated notes after completing each topic.',
      bullets: ['Auto-generated after topic', 'Downloadable PDF format', 'Personalized summaries']
    },
    {
      icon: '🧪', bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.05))', title: 'Smart Evaluations',
      desc: 'A multi-format evaluation system ensures genuine understanding at every level.',
      bullets: ['MCQ, True/False, Fill Blanks', 'Explanation-first learning', 'Mastery-gated progression']
    },
    {
      icon: '🎙️', bg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.05))', title: 'Voice Doubt Bot',
      desc: 'Students can ask questions anytime using voice or text to an AI tutor.',
      bullets: ['24/7 AI doubt resolution', 'Voice and text input', 'Context-aware answers']
    },
    {
      icon: '📄', bg: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.05))', title: 'AI Question Paper Generator',
      desc: 'Generate unique question papers per student — completely eliminating cheating.',
      bullets: ['Choose lessons & topics', 'Set number of papers', 'Each student gets unique paper']
    },
  ];

  steps = [
    { icon: '📗', title: 'Student Selects Subject', desc: 'Students log in and choose which subject they want to study today.' },
    { icon: '📖', title: 'Reads Lesson Explanation', desc: 'The AI presents a clear, structured explanation of the current topic.' },
    { icon: '🧠', title: 'AI Quiz Evaluates Understanding', desc: 'A quiz tests comprehension. The AI adapts based on performance.' },
    { icon: '🔓', title: 'Advanced Tests Unlock', desc: 'After passing basics, students unlock True/False and Fill-in-the-Blank challenges.' },
    { icon: '📥', title: 'AI Generates Notes', desc: 'A downloadable PDF note is generated summarising the completed topic.' },
    { icon: '📊', title: 'Progress Updated for Teachers', desc: 'Teacher dashboards update in real time reflecting the student\'s progress.' },
  ];

  personas = [
    {
      emoji: '🎓', role: 'Students', title: 'Learn Smarter, Not Harder',
      points: ['Interactive step-by-step learning', 'AI doubt solver available 24/7', 'Downloadable topic notes', 'Track your own progress', 'Unlock topics as you master them']
    },
    {
      emoji: '👩‍🏫', role: 'Teachers', title: 'Monitor, Assess & Empower',
      points: ['Monitor all student progress live', 'Generate unique question papers', 'Track subject-wise performance', 'Identify struggling students', 'Save time on assessments']
    },
    {
      emoji: '🏫', role: 'Schools', title: 'A Modern Learning Platform',
      points: ['Centralized school learning hub', 'Better performance analytics', 'Reduce cheating in exams', 'AI-driven modern education', 'Scalable for any school size']
    },
  ];

  screenshotTabs = [
    { label: 'Student Dashboard', icon: '🏠', url: 'student/dashboard' },
    { label: 'Lesson View', icon: '📖', url: 'lesson/photosynthesis' },
    { label: 'Quiz Page', icon: '🧠', url: 'quiz/chapter-3' },
    { label: 'Teacher Dashboard', icon: '👩‍🏫', url: 'teacher/dashboard' },
    { label: 'Question Paper Gen', icon: '📄', url: 'teacher/qp-generator' },
  ];

  teacherTableData = [
    { name: 'Aisha Khan', math: 88, science: 75, english: 92, status: 'On Track' },
    { name: 'Rohit Sharma', math: 62, science: 58, english: 70, status: 'Needs Help' },
    { name: 'Priya Desai', math: 95, science: 90, english: 88, status: 'On Track' },
    { name: 'Ali Hassan', math: 45, science: 50, english: 60, status: 'Needs Help' },
  ];



  faqs = [
    { q: 'What is YoZo?', a: 'YoZo is an AI-powered school learning platform that helps students learn topic by topic, tracks their progress automatically, and helps teachers generate unique question papers for each student.' },
    { q: 'How does the AI help students learn?', a: 'The AI presents lessons as structured explanations followed by quizzes. Students must demonstrate mastery before unlocking the next topic. It adapts to each student\'s pace and provides an AI doubt-solving chatbot.' },
    { q: 'Can teachers track individual student progress?', a: 'Yes! Teachers get real-time dashboards showing overall class progress, subject-wise performance, and individual student analytics including which topics they\'ve mastered and where they\'re struggling.' },
    { q: 'Can schools customize subjects and curriculum?', a: 'Absolutely. Schools can add their own subjects, lessons, and lesson sections. The platform is built to be fully customizable to match your school\'s curriculum and standards.' },
    { q: 'How does YoZo prevent cheating?', a: 'The AI Question Paper Generator creates a unique question paper for each student based on the same topics. Since no two papers are identical, cheating is effectively eliminated.' },
    { q: 'Is the platform secure?', a: 'Yes. YoZo uses secure authentication, encrypted data storage, and role-based access control. Teachers see only their classes, and students see only their own data.' },
    { q: 'How quickly can we set up YoZo for our school?', a: 'Most schools are fully set up within one day. Our onboarding process guides admins through adding teachers, students, subjects, and lessons step by step.' },
  ];

  // -------- LIFECYCLE --------

  ngOnInit(): void {
    this.startTypewriter();
    setTimeout(() => this.handleScrollReveal(), 300);
  }

  ngOnDestroy(): void {
    if (this.typewriterInterval) clearInterval(this.typewriterInterval);
  }

  // -------- TYPEWRITER --------

  startTypewriter(): void {
    this.typewriterInterval = setInterval(() => {
      const target = this.typewriterPhrases[this.currentFeature];
      if (this.deleting) {
        this.currentText = this.currentText.slice(0, -1);
        if (this.currentText === '') {
          this.deleting = false;
          this.currentFeature = (this.currentFeature + 1) % this.typewriterPhrases.length;
        }
      } else {
        this.currentText = target.slice(0, this.currentText.length + 1);
        if (this.currentText === target) {
          setTimeout(() => { this.deleting = true; }, 1800);
        }
      }
    }, this.deleting ? 55 : 95);
  }

  // -------- FAQ --------

  toggleFaq(i: number): void {
    this.openFaq = this.openFaq === i ? null : i;
  }

  // -------- NAV --------

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.mobileMenuOpen = false;
  }

  // -------- SCROLL EFFECTS --------

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
    this.handleScrollReveal();
  }

  handleScrollReveal(): void {
    document.querySelectorAll('.reveal').forEach((el: any) => {
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight - 100) {
        el.classList.add('revealed');
      }
    });
  }
}
