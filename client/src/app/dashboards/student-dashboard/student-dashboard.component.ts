import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';


import { DashboardServiceHelper } from '../dashboard.component.servicehelper';
import {
  IChildNode,
  UtilProgressBarComponent,
} from '../utils/progress-bar/progress-bar.component';
import { UtilChartComponent } from '../utils/chart/chart.component';
import { BarPlotter } from '../dashboard.component.servicePlotter';
import { ProgressService } from '../../progress/progress.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IProgress } from '../../progress/progress.model';
import { IStudent } from '../../student/student.model';
import { StudentService } from '../../student/student.service';
import { GamificationService } from '../../gamification/gamification.service';
import { IGamification } from '../../gamification/gamification.model';
import { XpBarComponent } from '../../ui/xp-bar/xp-bar.component';
import { BadgeComponent } from '../../ui/badge/badge.component';



enum tagChildList {
  completed,
  next,
  pending,
}
@Component({
  selector: 'app-student-dashboard',
  imports: [
    CommonModule,
    UtilProgressBarComponent,
    UtilChartComponent,
    XpBarComponent,
    BadgeComponent
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent {
  schoolId!: number;
  standardId!: number;
  studentId!: number;

  studentName = 'Loading...';
  perfOverall = 0;
  perfOverallPlotter: BarPlotter = new BarPlotter([], [], 'Loading...'); // Initialize with default

  perfPerSubject!: IChildNode[];
  perfPerLesson!: IChildNode[];

  subjectData: IChildNode[] = [];
  completedLessonSectionData: IChildNode[] = [];
  nextLessonSectionData: IChildNode[] = [];
  pendingLessonSectionData: IChildNode[] = [];

  gamificationProfile: IGamification | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private progressService: ProgressService,
    private serviceHelper: DashboardServiceHelper,
    private gamificationService: GamificationService,
    private studentService: StudentService
  ) {
    this.route.params.subscribe((params) => {
      this.schoolId = +params['schoolId'];
      this.standardId = +params['standardId'];
      this.studentId = +params['studentId'];
    });
  }

  ngOnInit(): void {
    console.log('STUDENT_DASHBOARD: Component Starting OnInit');
    console.log('STUDENT_DASHBOARD: Route Params Initialized:', { schoolId: this.schoolId, standardId: this.standardId, studentId: this.studentId });
    
    this.studentService.get(this.studentId).subscribe({
      next: (student: IStudent) => {
        console.log('STUDENT_DASHBOARD: Student Profile Fetched:', student.name);
        this.studentName = student.name;
      },
      error: (err) => console.error('STUDENT_DASHBOARD: Error fetching student profile:', err)
    });

    console.log('STUDENT_DASHBOARD: Calling initializeDashboardData');
    this.serviceHelper.initializeDashboardData(this.schoolId).subscribe({
      next: () => {
        console.log('STUDENT_DASHBOARD: Curriculum Data Initialized successfully');
        this.progressService
          .getAllStudent(this.schoolId, this.standardId, this.studentId)
          .subscribe({
            next: (progressData) => {
              console.log('STUDENT_DASHBOARD: Progress Data Received:', progressData ? progressData.length : 0);
              if (!progressData) progressData = [];
              this.perfOverall = this.serviceHelper.getOverallPerformance(progressData);
              this.perfOverallPlotter = new BarPlotter(
                [this.perfOverall],
                [0],
                'Overall Performance'
              );

              // Build subject data from ALL subjects in the student's standard
              this.subjectData = this.serviceHelper.subjects
                .filter((s) => Number(s.standard) === Number(this.standardId))
                .map((s) => {
                  const subjectProgress = progressData.filter((p) => Number(p.subject) === Number(s.Id));
                  
                  // Map Lessons for this subject
                  const lessons: IChildNode[] = this.serviceHelper.lessons
                    .filter((l) => Number(l.subject) === Number(s.Id))
                    .map((l) => {
                      const lessonProgress = subjectProgress.filter((p) => Number(p.lesson) === Number(l.Id));
                      
                      // Map Lesson Sections for this lesson
                      const sections: IChildNode[] = this.serviceHelper.lessonsections
                        .filter((ls) => Number(ls.lesson) === Number(l.Id))
                        .map((ls) => {
                          const sectionProgress = lessonProgress.find((p) => Number(p.lessonsection) === Number(ls.Id));
                          const score = sectionProgress ? (sectionProgress.quiz + sectionProgress.fillblanks + sectionProgress.truefalse) / 3 : 0;
                          
                          return {
                            Id: ls.Id!,
                            name: ls.name!,
                            score: score,
                            expanded: false
                          };
                        });

                      const lessonScore = sections.length > 0 
                        ? sections.reduce((sum, sec) => sum + sec.score, 0) / sections.length 
                        : 0;

                      return {
                        Id: l.Id!,
                        name: l.name!,
                        score: lessonScore,
                        expanded: false,
                        childList: sections
                      };
                    });

                  const subjectScore = lessons.length > 0
                    ? lessons.reduce((sum, les) => sum + les.score, 0) / lessons.length
                    : 0;

                  return {
                    Id: s.Id!,
                    name: s.name!,
                    score: subjectScore,
                    expanded: false,
                    childList: lessons
                  };
                });

              this.completedLessonSectionData = this.filterSubjectData(
                this.subjectData,
                (lessonSection) => lessonSection.score === 100
              );

              this.pendingLessonSectionData = this.filterSubjectData(
                this.subjectData,
                (lessonSection) => lessonSection.score < 100
              );

              let copiedSubjectData: IChildNode[] = JSON.parse(
                JSON.stringify(this.pendingLessonSectionData)
              );
              this.nextLessonSectionData = copiedSubjectData.map(
                (eachSubject) => {
                  let firstLesson = eachSubject.childList?.slice(0, 1);
                  if (firstLesson && firstLesson?.length > 0) {
                    let firstLessonSection = firstLesson[0].childList?.slice(0, 1);
                    firstLesson[0].childList = firstLessonSection;
                  }
                  eachSubject.childList = firstLesson;

                  return eachSubject;
                }
              );
            },
            error: (err) => {
              console.error('Error loading progress data:', err);
            },
          });

        this.gamificationService
          .getStudentProfile(this.studentId)
          .subscribe({
            next: (profile) => {
              if (profile) {
                this.gamificationProfile = profile;
              }
            },
            error: (err) => {
              console.warn('Error loading gamification profile:', err);
            },
          });
      },
      error: (err) => {
        console.error('Error initializing dashboard curriculum data:', err);
      },
    });
  }

  private filterSubjectData(
    subjectData: IChildNode[],
    comparisonFn: (lessonSection: IChildNode) => boolean
  ) {
    let copiedSubjectData: IChildNode[] = JSON.parse(
      JSON.stringify(subjectData)
    );

    let filteredSubjectData = copiedSubjectData
      // First, filter to only include subjects with at least one lesson section that passes the comparison
      .filter((subject) =>
        subject.childList?.some((lesson) =>
          lesson.childList?.some((lessonSection) => comparisonFn(lessonSection))
        )
      )
      // Then map those subjects to include only the qualifying lessons and lesson sections
      .map((subject) => {
        // Create a new subject object with filtered lessons
        return {
          ...subject,
          childList: subject.childList
            ?.filter((lesson: IChildNode) =>
              lesson.childList?.some((lessonSection: IChildNode) =>
                comparisonFn(lessonSection)
              )
            )
            // For each qualifying lesson, filter to only include sections that pass the comparison
            .map((lesson: IChildNode) => {
              return {
                ...lesson,
                childList: lesson.childList?.filter((lessonSection) =>
                  comparisonFn(lessonSection)
                ),
              };
            }),
        };
      });

    return filteredSubjectData;
  }

  clickByLessonSection(event: {
    parentId: number;
    childId: number;
    grandChildId: number;
  }) {
    console.log(
      'Subject Id: ' +
        event.parentId +
        ' Lesson Id: ' +
        event.childId +
        'Lesson Section Id: ',
      event.grandChildId
    );
    let subjectId = event.parentId;
    let lessonId = event.childId;
    let lessonSectionId = event.grandChildId;
    //'evaluation/school/:schoolId/standard/:standardId/student/:studentId/subject/:subjectId/lesson/:lessonId',
    this.router.navigate([
      'evaluation',
      'school',
      this.schoolId,
      'standard',
      this.standardId,
      'student',
      this.studentId,
      'subject',
      subjectId,
      'lesson',
      lessonId,
      'lessonsection',
      lessonSectionId]);
  }
}
