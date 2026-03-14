import { Sequelize, Transaction } from "sequelize";

import { ILoginDetail } from "./0.model";
import { DTOLoginDetail } from "./7.dto.model";

export interface IRepoLoginDetail {
  isExist(inLoginDetailId: number): Promise<boolean>;
  getAll(): Promise<ILoginDetail[] | null>;
  getById(inLoginDetailId: number): Promise<ILoginDetail | null>;
  getByName(inLoginDetailUsername: string): Promise<ILoginDetail | null>;
  create(
    inLoginDetail: ILoginDetail,
    transaction?: Transaction
  ): Promise<ILoginDetail | null>;
  update(
    logindetailId: number,
    inLoginDetail: ILoginDetail,
    transaction?: Transaction
  ): Promise<number>;
  delete(inLoginDetailId: number, transaction?: Transaction): Promise<number>;
  convertToObject(srcObject: DTOLoginDetail): ILoginDetail;
}
