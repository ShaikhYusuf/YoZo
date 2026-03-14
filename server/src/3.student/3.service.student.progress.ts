import { ILogger, LoggerService } from "../common/service/logger.service";
import TYPES from "../ioc/types";
import { container } from "../ioc/container";

import { IServiceProgress } from "../4.progress/3.service.model";
import { IServiceSubject } from "../6.subject/3.service.model";
import { IServiceLesson } from "../7.lesson/3.service.model";
import { IProgress } from "../4.progress/0.model";
import { IStudent } from "./0.model";
import { IServiceStudent } from "./3.service.model";
import { IServiceLessonSection } from "../7.lessonsection/3.service.model";

export class ServiceStudentProgressImpl {
  private serviceStudent: IServiceStudent;
  private serviceSubject: IServiceSubject;
  private serviceLesson: IServiceLesson;
  private serviceLessonSection: IServiceLessonSection;
  private serviceProgress: IServiceProgress;

  constructor() {
    this.serviceStudent = container.get(TYPES.ServiceStudent);
    this.serviceProgress = container.get(TYPES.ServiceProgress);
    this.serviceSubject = container.get(TYPES.ServiceSubject);
    this.serviceLesson = container.get(TYPES.ServiceLesson);
    this.serviceLessonSection = container.get(TYPES.ServiceLessonSection);
  }

  async create(inStudent: IStudent) {
    if (!inStudent.standard) {
      throw Error("Error: Student.Standard is Empty");
    }

    const subjectList = await this.serviceSubject.getAll(inStudent.standard);
    subjectList?.map(async (eachSubject) => {
      if (!eachSubject.Id) {
        throw Error("Error: Subject Id is Empty");
      }
      const lessonList = await this.serviceLesson.getAll(eachSubject.Id);
      lessonList?.map(async (eachLesson) => {
        const lessonsectionList = await this.serviceLessonSection.getAll(
          eachSubject.Id!,
          eachLesson.Id!
        );
        lessonsectionList?.map(async (eachLessonSection) => {
          const progress: IProgress = {
            quiz: 0,
            fillblanks: 0,
            truefalse: 0,
            school: inStudent.school,
            standard: inStudent.standard,
            student: inStudent?.Id,
            subject: eachSubject.Id,
            lesson: eachLesson.Id,
            lessonsection: eachLessonSection.Id,
          };

          await this.serviceProgress.create(progress);
        });
      });
    });
  }

  async delete(inStudentId: number) {
    const studentObj = await this.serviceStudent.get(inStudentId);
    if (!studentObj) {
      throw Error("Error: Failed to get the student object");
    }

    if (!studentObj.school || !studentObj.standard || !studentObj.Id) {
      throw Error("Error: Student School Or Standard or Id is emtpy");
    }

    const progressList = await this.serviceProgress.getAllStudent(
      studentObj.school,
      studentObj.standard,
      studentObj.Id
    );
    progressList?.map(async (eachProgress) => {
      if (eachProgress.Id) {
        await this.serviceProgress.delete(eachProgress.Id);
      }
    });
  }
}
