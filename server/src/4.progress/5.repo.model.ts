import { Sequelize, Transaction } from "sequelize";

import { IProgress } from "./0.model";
import { DTOProgress } from "./7.dto.model";

export interface IRepoProgress {
  isExist(inProgressId: number): Promise<boolean>;
  isExistProgress(
    inSchoolId: number,
    inStandardId: number,
    inStudentId: number,
    inSubjectId: number,
    inLessonId: number,
    inLessonSectionId: number
  ): Promise<IProgress | null>;

  getAllSchool(inSchoolId: number): Promise<IProgress[] | null>;
  getAllStandard(
    inSchoolId: number,
    inStandardId: number
  ): Promise<IProgress[] | null>;
  getAllStudent(
    inSchoolId: number,
    inStandardId: number,
    inStudentId: number
  ): Promise<IProgress[] | null>;

  getById(inProgressId: number): Promise<IProgress | null>;
  create(
    inProgress: IProgress,
    transaction?: Transaction
  ): Promise<IProgress | null>;
  update(
    progressId: number,
    inProgress: IProgress,
    transaction?: Transaction
  ): Promise<number>;
  delete(inProgressId: number, transaction?: Transaction): Promise<number>;
  convertToObject(srcObject: DTOProgress): IProgress;
}
