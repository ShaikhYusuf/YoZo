import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
export interface IChildNode {
  Id: number;
  name: string;
  score: number;
  expanded: boolean;
  childList?: IChildNode[] | null;
}

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [
    CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css'],
})
export class UtilProgressBarComponent {
  @Input() parentList: IChildNode[] | [] = [];
  @Output() onParentClick = new EventEmitter<number>();
  @Output() onChildClick = new EventEmitter<{
    parentId: number;
    childId: number;
  }>();
  @Output() onGrandChildClick = new EventEmitter<{
    parentId: number;
    childId: number;
    grandChildId: number;
  }>();

  constructor() {}

  ngOnInit(): void {}

  togglePanel(inParent: IChildNode, event: Event) {
    event.stopPropagation();
    this.parentList.forEach((eachParent) => {
      if (eachParent.name !== inParent.name) {
        eachParent.expanded = false;
      }
    });
    inParent.expanded = !inParent.expanded;
    this.onParentClick.emit(inParent.Id);
  }

  onEachChildClick(parentId: number, childId: number, event: Event) {
    console.log(
      `Child clicked: Parent ID = ${parentId}, Child ID = ${childId}`
    );
    this.onChildClick.emit({ parentId, childId });
    event.stopPropagation();
  }
  onEachGrandChildClick(
    parentId: number,
    childId: number,
    grandChildId: number,
    event: Event
  ) {
    console.log(
      `Child clicked: Parent ID = ${parentId}, Child ID = ${childId} Grand Child ID = ${grandChildId}`
    );
    this.onGrandChildClick.emit({ parentId, childId, grandChildId });
    event.stopPropagation();
  }
}
