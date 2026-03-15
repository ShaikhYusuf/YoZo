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

  perfOverall!: number;
  perfOverallPlotter: BarPlotter = new BarPlotter([], [], 'Loading...'); // Initialize with default

  perfPerSubject!: IChildNode[];
  perfPerLesson!: IChildNode[];

  subjectData!: IChildNode[];
  completedLessonSectionData!: IChildNode[] | [];
  nextLessonSectionData!: IChildNode[] | [];
  pendingLessonSectionData!: IChildNode[] | [];

  gamificationProfile: IGamification | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private progressService: ProgressService,
    private serviceHelper: DashboardServiceHelper,
    private gamificationService: GamificationService
  ) {
    this.route.params.subscribe((params) => {
      this.schoolId = +params['schoolId'];
      this.standardId = +params['standardId'];
      this.studentId = +params['studentId'];
    });
  }

  ngOnInit(): void {
    this.serviceHelper.initializeDashboardData(this.schoolId).subscribe(() => {
      this.progressService
        .getAllStudent(this.schoolId, this.standardId, this.studentId)
        .subscribe((data) => {
          this.perfOverall = this.serviceHelper.getOverallPerformance(data);
          this.perfOverallPlotter = new BarPlotter(
            [this.perfOverall],
            [0],
            'Overall Performance'
          );

          this.perfPerSubject = this.serviceHelper.getPerfPerSubject(data);
          this.subjectData = this.perfPerSubject.map((eachSubject) => {
            let lessonDataProgressList = data.filter(
              (eachProgress) => eachProgress.subject == eachSubject.Id
            );

            eachSubject.childList = this.serviceHelper.getPerfPerLesson(
              lessonDataProgressList
            );

            eachSubject.childList?.map((eachLesson) => {
              let lessonSectionDataProgressList = data.filter(
                (eachProgress) =>
                  eachProgress.subject == eachSubject.Id &&
                  eachProgress.lesson == eachLesson.Id
              );

              eachLesson.childList = this.serviceHelper.getPerfPerLessonSection(
                lessonSectionDataProgressList
              );
            });

            return eachSubject;
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
          this.nextLessonSectionData = copiedSubjectData.map((eachSubject) => {
            let firstLesson = eachSubject.childList?.slice(0, 1);
            if (firstLesson && firstLesson?.length > 0) {
              let firstLessonSection = firstLesson[0].childList?.slice(0, 1);
              firstLesson[0].childList = firstLessonSection;
            }
            eachSubject.childList = firstLesson;

            return eachSubject;
          });
        });
      
      this.gamificationService
        .getStudentProfile(this.studentId)
        .subscribe((profile) => {
          this.gamificationProfile = profile;
        });
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
