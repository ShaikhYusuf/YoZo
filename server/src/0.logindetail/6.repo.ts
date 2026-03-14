import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { ILoginDetail, RoleType } from "./0.model";
import { IRepoLoginDetail } from "./5.repo.model";
import { DTOLoginDetail } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoLoginDetailImpl implements IRepoLoginDetail {
  private getModel<T extends typeof Model>(model: T): T {
    const contextProvider = container.get(RequestContextProvider);
    const context = contextProvider.get();

    if (!context || !context.databaseConnection) {
      throw new Error("Sequelize instance not found in context");
    }

    const modelInstance = context.databaseConnection.model(model.name) as T;
    if (!modelInstance) {
      throw new Error(`Model ${model.name} not initialized`);
    }

    return modelInstance;
  }

  async isExist(inLoginDetailId: number): Promise<boolean> {
    const LoginDetailModel = this.getModel(DTOLoginDetail);
    const found = await LoginDetailModel.findOne({
      where: { Id: inLoginDetailId },
    });
    return found !== null;
  }

  async getAll(): Promise<ILoginDetail[] | null> {
    const LoginDetailModel = this.getModel(DTOLoginDetail);
    const foundObj = await LoginDetailModel.findAll<DTOLoginDetail>();
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getById(inLoginDetailId: number): Promise<ILoginDetail | null> {
    const LoginDetailModel = this.getModel(DTOLoginDetail);
    const foundObj = await LoginDetailModel.findOne<DTOLoginDetail>({
      where: { Id: inLoginDetailId },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async getByName(inLoginDetailUsername: string): Promise<ILoginDetail | null> {
    const LoginDetailModel = this.getModel(DTOLoginDetail);
    const foundObj = await LoginDetailModel.findOne<DTOLoginDetail>({
      where: { name: inLoginDetailUsername },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async create(
    inLoginDetail: Partial<ILoginDetail>,
    transaction?: Transaction
  ): Promise<ILoginDetail | null> {
    const LoginDetailModel = this.getModel(DTOLoginDetail);
    const createdObj = await LoginDetailModel.create(inLoginDetail, {
      transaction,
    });
    createdObj.dataValues.Id = createdObj.Id;
    return this.convertToObject(createdObj.dataValues);
  }

  async update(
    logindetailId: number,
    inLoginDetail: ILoginDetail,
    transaction?: Transaction
  ): Promise<number> {
    const LoginDetailModel = this.getModel(DTOLoginDetail);

    const [count] = await LoginDetailModel.update(inLoginDetail, {
      where: { Id: logindetailId },
      transaction,
    });

    return count;
  }

  async delete(
    inLoginDetailId: number,
    transaction?: Transaction
  ): Promise<number> {
    const LoginDetailModel = this.getModel(DTOLoginDetail);
    const count = await LoginDetailModel.destroy({
      where: { Id: inLoginDetailId },
      transaction,
    });
    return count;
  }

  convertToObject(srcObject: DTOLoginDetail): ILoginDetail {
    return {
      Id: srcObject.Id,
      name: srcObject.name,
      adhaar: srcObject.adhaar,
      password: srcObject.password,
      role: srcObject.role as RoleType,
    };
  }
}
