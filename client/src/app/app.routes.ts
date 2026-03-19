import { Routes } from '@angular/router';
import { authGuard } from './common/guards/auth.guard';
import { roleGuard } from './common/guards/role.guard';

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
    loadComponent: () => import('./login-detail/logindetail.component').then(m => m.LoginDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'principal'], permissions: ['VIEW_USERS'] }
  },

  //====================================| Principal/Teachers routes
  { path: 'principal', redirectTo: 'school-dashboard', pathMatch: 'full' },
  { path: 'teacher', redirectTo: 'school-dashboard', pathMatch: 'full' },

  { 
    path: 'school-dashboard', 
    loadComponent: () => import('./dashboards/school-dashboard/school-dashboard.component').then(m => m.SchoolDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'principal', 'teacher'], permissions: ['VIEW_DASHBOARD'] }
  },
  {
    path: 'standard-dashboard/school/:schoolId/standard/:standardId',
    loadComponent: () => import('./dashboards/standard-dashboard/standard-dashboard.component').then(m => m.StandardDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'principal', 'teacher'] }
  },

  //====================================| Admin routes
  { path: 'admin', redirectTo: 'school', pathMatch: 'full' },
  { 
    path: 'school', 
    loadComponent: () => import('./school/school.component').then(m => m.SchoolComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'], permissions: ['EDIT_COLLEGES'] }
  },
  {
    path: 'schoolstandard/school/:schoolId',
    loadComponent: () => import('./school-standard/schoolstandard.component').then(m => m.SchoolStandardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'standard', 
    loadComponent: () => import('./standard/standard.component').then(m => m.StandardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'student/school/:schoolId/standard/:standardId',
    loadComponent: () => import('./student/student.component').then(m => m.StudentComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'principal', 'teacher'] }
  },
  {
    path: 'teacher/school/:schoolId/standard/:standardId',
    loadComponent: () => import('./teacher/teacher.component').then(m => m.TeacherComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'principal'] }
  },
  { 
    path: 'subject/standard/:standardId', 
    loadComponent: () => import('./subject/subject.component').then(m => m.SubjectComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'principal', 'teacher'] }
  },
  { 
    path: 'lesson/subject/:subjectId', 
    loadComponent: () => import('./lesson/lesson.component').then(m => m.LessonComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'principal', 'teacher'] }
  },
  {
    path: 'lessonsection/subject/:subjectId/lesson/:lessonId',
    loadComponent: () => import('./lesson-section/lessonsection.component').then(m => m.LessonSectionComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'principal', 'teacher'] }
  },

  //====================================| Students routes
  {
    path: 'student-dashboard',
    loadComponent: () => import('./dashboards/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student', 'parent'] }
  },
  {
    path: 'student/school/:schoolId/standard/:standardId/student/:studentId',
    redirectTo: 'student-dashboard',
    pathMatch: 'full',
  },
  {
    path: 'student-dashboard/school/:schoolId/standard/:standardId/student/:studentId',
    loadComponent: () => import('./dashboards/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student', 'parent'] }
  },
  {
    path: 'evaluation/school/:schoolId/standard/:standardId/student/:studentId/subject/:subjectId/lesson/:lessonId/lessonsection/:lessonsectionId',
    loadComponent: () => import('./evaluation/evaluation/evaluation.component').then(m => m.EvaluationComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student', 'parent'] }
  },
  {
    path: 'progress/school/:schoolId/standard/:standardId/student/:studentId',
    loadComponent: () => import('./progress/progress.component').then(m => m.ProgressComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student', 'parent', 'teacher', 'admin', 'principal'] }
  },
  {
    path: 'subject-dashboard2/school/:schoolId/standard/:standardId/student/:studentId',
    loadComponent: () => import('./dashboards/subject-dashboard2/subject-dashboard2.component').then(m => m.SubjectDashboard2Component),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student', 'parent'] }
  },

  //====================================| Voice & AI routes (from Dip-Project)
  { 
    path: 'voice-settings', 
    loadComponent: () => import('./voice/voice-selection.component').then(m => m.VoiceSelectionComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'principal', 'teacher', 'student', 'parent'], permissions: ['MANAGE_SETTINGS'] }
  },
  {
    path: 'lesson-ai-hierarchy',
    loadComponent: () => import('./lesson-ai/lesson-hierarchy/lesson-hierarchy.component').then(m => m.AiLessonHierarchyComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'teacher'] }
  },
  {
    path: 'lesson-ai-content',
    loadComponent: () => import('./lesson-ai/lesson-content/lesson-content.component').then(m => m.AiLessonContentComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'teacher'] }
  },
  {
    path: 'lesson-ai-quiz',
    loadComponent: () => import('./lesson-ai/lesson-quiz/lesson-quiz.component').then(m => m.AiLessonQuizComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'teacher'] }
  },
  {
    path: 'lesson-ai-truefalse',
    loadComponent: () => import('./lesson-ai/lesson-truefalse/lesson-truefalse.component').then(m => m.AiLessonTrueFalseComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'teacher'] }
  },
  {
    path: 'lesson-ai-shortquestion',
    loadComponent: () => import('./lesson-ai/lesson-shortquestion/lesson-shortquestion.component').then(m => m.AiLessonShortQuestionComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'teacher'] }
  },

  //====================================| Generic User Routes
  { 
    path: 'profile', 
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard] 
  },
];

