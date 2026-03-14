import { Sequelize, Transaction } from "sequelize";

import { ILesson } from "./0.model";
import { DTOLesson } from "./7.dto.model";

export interface IRepoLesson {
  isExist(inLessonId: number): Promise<boolean>;
  getAll(inSubjectId: number): Promise<ILesson[] | null>;
  getById(inLessonId: number): Promise<ILesson | null>;
  create(inLesson: ILesson, transaction?: Transaction): Promise<ILesson | null>;
  update(
    lessonId: number,
    inLesson: ILesson,
    transaction?: Transaction
  ): Promise<number>;
  delete(inLessonId: number, transaction?: Transaction): Promise<number>;
  convertToObject(srcObject: DTOLesson): ILesson;
}
