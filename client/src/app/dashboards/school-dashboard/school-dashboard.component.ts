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
import { AuthService } from '../../common/auth.service';



@Component({
  selector: 'app-school-dashboard',
  imports: [
    CommonModule,UtilProgressBarComponent,
    UtilChartComponent
  ],
  templateUrl: './school-dashboard.component.html',
  styleUrl: './school-dashboard.component.css',
})
export class SchoolDashboardComponent {
  schoolId: number = 1;

  perfOverall!: number;
  perfOverallPlotter!: BarPlotter;

  perfPerStandard!: IChildNode[];
  perfPerSubject!: IChildNode[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private progressService: ProgressService,
    private serviceHelper: DashboardServiceHelper,
    private authService: AuthService
  ) {
    this.schoolId = this.authService.user().schoolId ?? 1;
  }

  ngOnInit(): void {
    this.serviceHelper.initializeDashboardData(this.schoolId).subscribe(() => {
      this.progressService.getAllSchool(this.schoolId).subscribe((data) => {
        this.perfOverall = this.serviceHelper.getOverallPerformance(data);

        // Standard => Overall
        let perfPerStandardTemp = this.serviceHelper.getPerfPerStandard(data);
        this.perfPerStandard = perfPerStandardTemp.map((eachStandard) => {
          return {
            Id: eachStandard.Id,
            name: eachStandard.name,
            score: eachStandard.score,
            expanded: false,
            childList: [],
          } as IChildNode;
        });

        this.perfOverallPlotter! = new BarPlotter(
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
      });
    });
  }

  clickByStandard(parentId: number) {
    this.router.navigate([
      'standard-dashboard',
      'school',
      this.schoolId,
      'standard',
      parentId]);
  }

  clickBySubject(parentId: number) {
  }
}
