import { Sequelize, Transaction } from "sequelize";

import { ISubject } from "./0.model";
import { DTOSubject } from "./7.dto.model";

export interface IRepoSubject {
  isExist(inSubjectId: number): Promise<boolean>;
  getAll(inStandardId: number): Promise<ISubject[] | null>;
  getById(inSubjectId: number): Promise<ISubject | null>;
  create(
    inSubject: ISubject,
    transaction?: Transaction
  ): Promise<ISubject | null>;
  update(
    subjectId: number,
    inSubject: ISubject,
    transaction?: Transaction
  ): Promise<number>;
  delete(inSubjectId: number, transaction?: Transaction): Promise<number>;
  convertToObject(srcObject: DTOSubject): ISubject;
}
