import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  catchError,
  filter,
  forkJoin,
  from,
  map,
  mergeMap,
  of,
  switchMap,
  toArray,
} from 'rxjs';
import { ISchool } from '../school/school.model';
import { ISchoolStandard } from '../school-standard/schoolstandard.model';
import { IStudent } from '../student/student.model';
import { IProgress } from '../progress/progress.model';
import { IStandard } from '../standard/standard.model';
import { ISubject } from '../subject/subject.model';
import { ILesson } from '../lesson/lesson.model';
import { SchoolService } from '../school/school.service';
import { SchoolStandardService } from '../school-standard/schoolstandard.service';
import { SubjectService } from '../subject/subject.service';
import { LessonService } from '../lesson/lesson.service';
import { StudentService } from '../student/student.service';
import { StandardService } from '../standard/standard.service';
import { LessonSectionService } from '../lesson-section/lessonsection.service';
import { ILessonSection } from '../lesson-section/lessonsection.model';
import { IChildNode } from './utils/progress-bar/progress-bar.component';

@Injectable({
  providedIn: 'root',
})
export class DashboardServiceHelper {
  schools!: ISchool[];
  schoolStandard!: ISchoolStandard[];
  students!: IStudent[];
  standards!: IStandard[];
  subjects!: ISubject[];
  lessons!: ILesson[];
  lessonsections!: ILessonSection[];

  //====================================| Dummy Data
  constructor(
    private schoolService: SchoolService,
    private schoolStandardService: SchoolStandardService,
    private standardService: StandardService,
    private studentService: StudentService,
    private subjectService: SubjectService,
    private lessonService: LessonService,
    private lessonSectionService: LessonSectionService
  ) {}

  public initializeDashboardData(inSchoolId: number): Observable<void> {
    console.log('Initializing Dashboard Data for School:', inSchoolId);
    return this.schoolService.get(inSchoolId).pipe(
      switchMap((school) => {
        console.log('Fetched School:', school);
        this.schools = [school];
        return this.schoolStandardService.getAll(inSchoolId);
      }),
      switchMap((schoolStandards) => {
        console.log('Fetched School Standards:', schoolStandards);
        this.schoolStandard = schoolStandards;
        return forkJoin({
          standards: this.getStandards(schoolStandards),
          subjects: this.getSubjects(schoolStandards),
          students: this.getStudents(inSchoolId, schoolStandards),
        });
      }),
      switchMap(({ standards, subjects, students }) => {
        console.log('Fetched Data: Standards:', standards.length, 'Subjects:', subjects.length, 'Students:', students.length);
        this.standards = standards;
        this.subjects = subjects;
        this.students = students;
        return this.getLessons(subjects);
      }),
      switchMap((lessons) => {
        console.log('Fetched Lessons:', lessons.length);
        this.lessons = lessons;
        return this.getLessonSections(lessons);
      }),
      map((lessonSections) => {
        console.log('Fetched Lesson Sections RAW:', JSON.stringify(lessonSections, null, 2));
        console.log('Fetched Lesson Sections:', lessonSections.length);
        this.lessonsections = lessonSections;
      })
    );
  }

  private getStandards(schoolStandards: ISchoolStandard[]) {
    return from(schoolStandards).pipe(
      mergeMap((standard) => this.standardService.getAll().pipe(catchError(() => of([])))),
      toArray(),
      map((standardLists) => standardLists.flat())
    );
  }

  private getSubjects(schoolStandards: ISchoolStandard[]) {
    return from(schoolStandards).pipe(
      mergeMap((standard) => this.subjectService.getAll(standard.standard!).pipe(catchError(() => of([])))),
      toArray(),
      map((subjectLists) => subjectLists.flat())
    );
  }

  private getStudents(inSchoolId: number, schoolStandards: ISchoolStandard[]) {
    return from(schoolStandards).pipe(
      mergeMap((standard) =>
        this.studentService.getAll(inSchoolId, standard.standard!).pipe(catchError(() => of([])))
      ),
      toArray(),
      map((studentLists) => studentLists.flat())
    );
  }

  private getLessons(subjects: ISubject[]) {
    return from(subjects).pipe(
      mergeMap((subject) => this.lessonService.getAll(subject.Id!).pipe(catchError(() => of([])))),
      toArray(),
      map((lessonLists) => lessonLists.flat())
    );
  }

  private getLessonSections(lessons: ILesson[]) {
    return from(lessons).pipe(
      mergeMap((lessons) =>
        this.lessonSectionService.getAll(lessons.subject!, lessons.Id!).pipe(catchError(() => of([])))
      ),
      toArray(),
      map((lessonSectionList) => lessonSectionList.flat())
    );
  }

  //==========================================================| Overall Performance
  public getOverallPerformance(progressList: IProgress[]): number {
    if (!progressList || progressList.length === 0) return 0;
    const total = progressList.reduce(
      (sum, p) => sum + p.quiz + p.fillblanks + p.truefalse,
      0
    );
    return Math.round(total / (progressList.length * 3));
  }

  //==========================================================| Performance Grouping
  // School => Standard => Student => Subject => Lesson
  public getPerfPerStandard(progressList: IProgress[]): IChildNode[] {
    const standardMap = new Map<number, { score: number; count: number }>();
    progressList.forEach((p) => {
      if (!standardMap.has(p.standard!)) {
        standardMap.set(p.standard!, { score: 0, count: 0 });
      }
      let std = standardMap.get(p.standard!)!;

      std.score += p.quiz + p.fillblanks + p.truefalse;
      std.count += 3;
    });

    return Array.from(standardMap.entries()).map(([standard, data]) => ({
      Id: standard,
      name: this.standards.find((s) => s.Id === standard)?.name || 'Unknown',
      score: data.score / data.count,
      expanded: false,
    }));
  }

  public getPerfPerSubject(progressList: IProgress[]): IChildNode[] {
    const subjectMap = new Map<number, { score: number; count: number }>();
    progressList.forEach((p) => {
      if (!subjectMap.has(p.subject!)) {
        subjectMap.set(p.subject!, { score: 0, count: 0 });
      }
      let subj = subjectMap.get(p.subject!)!;

      subj.score += p.quiz + p.fillblanks + p.truefalse;
      subj.count += 3;
    });

    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      Id: subject,
      name: this.subjects.find((s) => s.Id === subject)?.name || 'Unknown',
      score: data.score / data.count,
      expanded: false,
    }));
  }

  public getPerfPerStudent(progressList: IProgress[]): IChildNode[] {
    const studentMap = new Map<number, { score: number; count: number }>();
    progressList.forEach((p) => {
      if (!studentMap.has(p.student!)) {
        studentMap.set(p.student!, { score: 0, count: 0 });
      }
      let student = studentMap.get(p.student!)!;
      student.score += p.quiz + p.fillblanks + p.truefalse;
      student.count += 3;
    });

    return Array.from(studentMap.entries()).map(([student, data]) => ({
      Id: student,
      name: this.students.find((s) => s.Id === student)?.name || 'Unknown',
      score: data.score / data.count,
      expanded: false,
    }));
  }

  public getPerfPerLesson(progressList: IProgress[]): IChildNode[] {
    const lessonMap = new Map<number, { score: number; count: number }>();
    progressList.forEach((p) => {
      if (!lessonMap.has(p.lesson!)) {
        lessonMap.set(p.lesson!, { score: 0, count: 0 });
      }
      let lesson = lessonMap.get(p.lesson!)!;
      lesson.score += p.quiz + p.fillblanks + p.truefalse;
      lesson.count += 3;
    });

    return Array.from(lessonMap.entries()).map(([lessonId, data]) => {
      return {
        Id: lessonId || 0,
        name: this.lessons.find((s) => s.Id === lessonId)?.name || 'Unknown',
        score: data.score / data.count,
        expanded: false,
      };
    });
  }

  public getPerfPerLessonSection(progressList: IProgress[]): IChildNode[] {
    const lessonSectionMap = new Map<
      number,
      { score: number; count: number }
    >();
    progressList.forEach((p) => {
      if (!lessonSectionMap.has(p.lessonsection!)) {
        lessonSectionMap.set(p.lessonsection!, { score: 0, count: 0 });
      }
      let lessonsection = lessonSectionMap.get(p.lessonsection!)!;
      lessonsection.score += p.quiz + p.fillblanks + p.truefalse;
      lessonsection.count += 3;
    });

    return Array.from(lessonSectionMap.entries()).map(
      ([lessonsectionId, data]) => {
        return {
          Id: lessonsectionId || 0,
          name:
            this.lessonsections.find((s) => s.Id === lessonsectionId)?.name ||
            'Unknown',
          score: data.score / data.count,
          expanded: false,
        };
      }
    );
  }
}
