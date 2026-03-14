import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';


import { DashboardServiceHelper } from '../dashboard.component.servicehelper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  IChildNode,
  UtilProgressBarComponent,
} from '../0.utils/1.progress-bar/progress-bar.component';
import { BarPlotter } from '../dashboard.component.servicePlotter';
import { ProgressService } from '../../4.progress/progress.service';
import { ActivatedRoute, Router } from '@angular/router';



@Component({
  selector: 'app-standard-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,

    MatExpansionModule,
    MatProgressBarModule,
    MatTooltipModule,
    UtilProgressBarComponent,
  ],
  templateUrl: './standard-dashboard.component.html',
  styleUrl: './standard-dashboard.component.css',
})
export class StandardDashboardComponent {
  schoolId: number = 1;
  standardId: number = 1;

  perfOverall!: number;
  perfOverallPlotter!: BarPlotter;

  perfPerSubject!: IChildNode[];
  perfPerStudent!: IChildNode[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private progressService: ProgressService,
    private serviceHelper: DashboardServiceHelper
  ) {
    this.route.params.subscribe((params) => {
      this.schoolId = +params['schoolId'];
      this.standardId = +params['standardId'];
    });
  }

  ngOnInit(): void {
    this.serviceHelper.initializeDashboardData(this.schoolId).subscribe(() => {
      this.progressService
        .getAllStandard(this.schoolId, this.standardId)
        .subscribe((data) => {
          this.perfOverall = this.serviceHelper.getOverallPerformance(data);
          this.perfOverallPlotter = new BarPlotter(
            [this.perfOverall],
            [0],
            'Overall Performance'
          );

          let perfPerSubjectTemp = this.serviceHelper.getPerfPerSubject(data);
          this.perfPerSubject = perfPerSubjectTemp.map((eachSubject) => {
            return {
              Id: eachSubject.Id,
              name: eachSubject.name,
              score: eachSubject.score,
              expanded: false,
              childList: [],
            } as IChildNode;
          });

          let perfPerStudentTemp = this.serviceHelper.getPerfPerStudent(data);
          this.perfPerStudent = perfPerStudentTemp.map((eachStandard) => {
            return {
              Id: eachStandard.Id,
              name: eachStandard.name,
              score: eachStandard.score,
              expanded: false,
              childList: [],
            } as IChildNode;
          });
        });
    });
  }

  clickBySubject(parentId: number) {
    console.log('Subject Id: ' + parentId);
  }

  clickByStudent(parentId: number) {
    console.log('Student Id: ' + parentId);
    this.router.navigate([
      'student-dashboard',
      'school',
      this.schoolId,
      'standard',
      this.standardId,
      'student',
      parentId,
    ]);
  }
}
