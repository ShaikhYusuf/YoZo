import { Sequelize, Transaction } from "sequelize";

import { ISchool } from "./0.model";
import { DTOSchool } from "./7.dto.model";

export interface IRepoSchool {
  isExist(inSchoolId: number): Promise<boolean>;
  getAll(): Promise<ISchool[] | null>;
  getById(inSchoolId: number): Promise<ISchool | null>;
  create(inSchool: ISchool, transaction?: Transaction): Promise<ISchool | null>;
  update(
    schoolId: number,
    inSchool: ISchool,
    transaction?: Transaction
  ): Promise<number>;
  delete(inSchoolId: number, transaction?: Transaction): Promise<number>;
  convertToObject(srcObject: DTOSchool): ISchool;
}
