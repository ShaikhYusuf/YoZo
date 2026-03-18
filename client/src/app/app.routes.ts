import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./landing-page/landing-page.component').then(m => m.LandingPageComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'login-details', 
    loadComponent: () => import('./login-detail/logindetail.component').then(m => m.LoginDetailComponent) 
  },

  //====================================| Principal/Teachers routes
  { path: 'principal', redirectTo: 'school-dashboard', pathMatch: 'full' },
  { path: 'teacher', redirectTo: 'school-dashboard', pathMatch: 'full' },

  { 
    path: 'school-dashboard', 
    loadComponent: () => import('./dashboards/school-dashboard/school-dashboard.component').then(m => m.SchoolDashboardComponent) 
  },
  {
    path: 'standard-dashboard/school/:schoolId/standard/:standardId',
    loadComponent: () => import('./dashboards/standard-dashboard/standard-dashboard.component').then(m => m.StandardDashboardComponent),
  },

  //====================================| Admin routes
  { path: 'admin', redirectTo: 'school', pathMatch: 'full' },
  { 
    path: 'school', 
    loadComponent: () => import('./school/school.component').then(m => m.SchoolComponent) 
  },
  {
    path: 'schoolstandard/school/:schoolId',
    loadComponent: () => import('./school-standard/schoolstandard.component').then(m => m.SchoolStandardComponent),
  },
  { 
    path: 'standard', 
    loadComponent: () => import('./standard/standard.component').then(m => m.StandardComponent) 
  },
  {
    path: 'student/school/:schoolId/standard/:standardId',
    loadComponent: () => import('./student/student.component').then(m => m.StudentComponent),
  },
  {
    path: 'teacher/school/:schoolId/standard/:standardId',
    loadComponent: () => import('./teacher/teacher.component').then(m => m.TeacherComponent),
  },
  { 
    path: 'subject/standard/:standardId', 
    loadComponent: () => import('./subject/subject.component').then(m => m.SubjectComponent) 
  },
  { 
    path: 'lesson/subject/:subjectId', 
    loadComponent: () => import('./lesson/lesson.component').then(m => m.LessonComponent) 
  },
  {
    path: 'lessonsection/subject/:subjectId/lesson/:lessonId',
    loadComponent: () => import('./lesson-section/lessonsection.component').then(m => m.LessonSectionComponent),
  },

  //====================================| Students routes
  {
    path: 'student/school/:schoolId/standard/:standardId/student/:studentId',
    redirectTo: 'student-dashboard',
    pathMatch: 'full',
  },
  {
    path: 'student-dashboard/school/:schoolId/standard/:standardId/student/:studentId',
    loadComponent: () => import('./dashboards/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
  },
  {
    path: 'evaluation/school/:schoolId/standard/:standardId/student/:studentId/subject/:subjectId/lesson/:lessonId/lessonsection/:lessonsectionId',
    loadComponent: () => import('./evaluation/evaluation/evaluation.component').then(m => m.EvaluationComponent),
  },
  {
    path: 'progress/school/:schoolId/standard/:standardId/student/:studentId',
    loadComponent: () => import('./progress/progress.component').then(m => m.ProgressComponent),
  },
  {
    path: 'subject-dashboard2/school/:schoolId/standard/:standardId/student/:studentId',
    loadComponent: () => import('./dashboards/subject-dashboard2/subject-dashboard2.component').then(m => m.SubjectDashboard2Component),
  },

  //====================================| Voice & AI routes (from Dip-Project)
  { 
    path: 'voice-settings', 
    loadComponent: () => import('./voice/voice-selection.component').then(m => m.VoiceSelectionComponent) 
  },
  {
    path: 'lesson-ai-hierarchy',
    loadComponent: () => import('./lesson-ai/lesson-hierarchy/lesson-hierarchy.component').then(m => m.AiLessonHierarchyComponent)
  },
  {
    path: 'lesson-ai-content',
    loadComponent: () => import('./lesson-ai/lesson-content/lesson-content.component').then(m => m.AiLessonContentComponent)
  },
  {
    path: 'lesson-ai-quiz',
    loadComponent: () => import('./lesson-ai/lesson-quiz/lesson-quiz.component').then(m => m.AiLessonQuizComponent)
  },
  {
    path: 'lesson-ai-truefalse',
    loadComponent: () => import('./lesson-ai/lesson-truefalse/lesson-truefalse.component').then(m => m.AiLessonTrueFalseComponent)
  },
  {
    path: 'lesson-ai-shortquestion',
    loadComponent: () => import('./lesson-ai/lesson-shortquestion/lesson-shortquestion.component').then(m => m.AiLessonShortQuestionComponent)
  },


  //====================================| Generic User Routes
  { 
    path: 'profile', 
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) 
  },
];

