import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectDashboard2 } from './subject-dashboard2';

describe('SubjectDashboard2', () => {
  let component: SubjectDashboard2;
  let fixture: ComponentFixture<SubjectDashboard2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectDashboard2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubjectDashboard2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
