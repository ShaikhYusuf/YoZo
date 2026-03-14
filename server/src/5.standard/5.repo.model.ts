import { Sequelize, Transaction } from "sequelize";

import { IStandard } from "./0.model";
import { DTOStandard } from "./7.dto.model";

export interface IRepoStandard {
  isExist(inStandardId: number): Promise<boolean>;
  getAll(): Promise<IStandard[] | null>;
  getById(inStandardId: number): Promise<IStandard | null>;
  create(
    inStandard: IStandard,
    transaction?: Transaction
  ): Promise<IStandard | null>;
  update(
    standardId: number,
    inStandard: IStandard,
    transaction?: Transaction
  ): Promise<number>;
  delete(inStandardId: number, transaction?: Transaction): Promise<number>;
  convertToObject(srcObject: DTOStandard): IStandard;
}
