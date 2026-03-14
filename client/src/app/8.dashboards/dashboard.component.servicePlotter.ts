import { ChartConfiguration } from 'chart.js';

export class BarPlotter {
  chartConfig: ChartConfiguration;

  constructor(inXPerfValue: number[], inYPerfValue: number[], title: string) {
    this.chartConfig = {
      type: 'bar' as const,
      data: {
        labels: [''],
        datasets: [{
          label: title,
          data: inXPerfValue,
          backgroundColor: inXPerfValue[0] >= 75 ? 'green' : inXPerfValue[0] >= 50 ? 'yellow' : 'red',
        }]
      },
      options: {
        indexAxis: 'y' as const, // horizontal bar in Chart.js v3+
        scales: {
          x: {
            min: 0,
            max: 100,
            title: { display: true, text: 'Percentage' }
          }
        },
        plugins: {
          legend: { display: false },
          title: { display: true, text: title }
        },
        maintainAspectRatio: false
      }
    };
  }
}

export class PiePlotter {
  chartConfig: ChartConfiguration;

  constructor(inLabels: string[], inValues: number[], title: string) {
    this.chartConfig = {
      type: 'pie' as const,
      data: {
        labels: inLabels,
        datasets: [{
          data: inValues,
          backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)'
          ]
        }]
      },
      options: {
        plugins: {
          legend: { position: 'right' as const },
          title: { display: true, text: title }
        },
        maintainAspectRatio: false
      }
    };
  }
}
