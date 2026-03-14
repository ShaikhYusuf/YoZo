import { Sequelize, Transaction } from "sequelize";

import { ILessonSection } from "./0.model";
import { DTOLessonSection } from "./7.dto.model";

export interface IRepoLessonSection {
  isExist(inLessonId: number): Promise<boolean>;
  getAll(
    inSubjectId: number,
    inLessonSectionId: number
  ): Promise<ILessonSection[] | null>;
  getById(inLessonSectionId: number): Promise<ILessonSection | null>;
  create(
    inLessonSection: ILessonSection,
    transaction?: Transaction
  ): Promise<ILessonSection | null>;
  update(
    lessonSectionId: number,
    inLessonSection: ILessonSection,
    transaction?: Transaction
  ): Promise<number>;
  delete(inLessonSectionId: number, transaction?: Transaction): Promise<number>;
  convertToObject(srcObject: DTOLessonSection): ILessonSection;
}
