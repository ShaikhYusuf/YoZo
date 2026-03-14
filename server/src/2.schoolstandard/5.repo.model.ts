import { Sequelize, Transaction } from "sequelize";

import { ISchoolStandard } from "./0.model";
import { DTOSchoolStandard } from "./7.dto.model";

export interface IRepoSchoolStandard {
  isExist(inSchoolStandardId: number): Promise<boolean>;
  getAll(inSchoolId: number): Promise<ISchoolStandard[] | null>;
  getById(inSchoolStandardId: number): Promise<ISchoolStandard | null>;
  create(
    inSchoolStandard: ISchoolStandard,
    transaction?: Transaction
  ): Promise<ISchoolStandard | null>;
  update(
    schoolstandardId: number,
    inSchoolStandard: ISchoolStandard,
    transaction?: Transaction
  ): Promise<number>;
  delete(
    inSchoolStandardId: number,
    transaction?: Transaction
  ): Promise<number>;
  convertToObject(srcObject: DTOSchoolStandard): ISchoolStandard;
}
