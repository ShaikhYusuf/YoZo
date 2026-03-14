import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { IStandard } from "./0.model";
import { IRepoStandard } from "./5.repo.model";
import { DTOStandard } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoStandardImpl implements IRepoStandard {
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

  async isExist(inStandardId: number): Promise<boolean> {
    const StandardModel = this.getModel(DTOStandard);
    const found = await StandardModel.findOne({
      where: { Id: inStandardId },
    });
    return found !== null;
  }

  async getAll(): Promise<IStandard[] | null> {
    const StandardModel = this.getModel(DTOStandard);
    const foundObj = await StandardModel.findAll<DTOStandard>();
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getById(inStandardId: number): Promise<IStandard | null> {
    const StandardModel = this.getModel(DTOStandard);
    const foundObj = await StandardModel.findOne<DTOStandard>({
      where: { Id: inStandardId },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async create(
    inStandard: Partial<IStandard>,
    transaction?: Transaction
  ): Promise<IStandard | null> {
    const StandardModel = this.getModel(DTOStandard);
    const createdObj = await StandardModel.create(inStandard, {
      transaction,
    });
    createdObj.dataValues.Id = createdObj.Id;
    return this.convertToObject(createdObj.dataValues);
  }

  async update(
    standardId: number,
    inStandard: IStandard,
    transaction?: Transaction
  ): Promise<number> {
    const StandardModel = this.getModel(DTOStandard);

    const [count] = await StandardModel.update(inStandard, {
      where: { Id: standardId },
      transaction,
    });

    return count;
  }

  async delete(
    inStandardId: number,
    transaction?: Transaction
  ): Promise<number> {
    const StandardModel = this.getModel(DTOStandard);
    const count = await StandardModel.destroy({
      where: { Id: inStandardId },
      transaction,
    });
    return count;
  }

  convertToObject(srcObject: DTOStandard): IStandard {
    return {
      Id: srcObject.Id,
      name: srcObject.name,
    };
  }
}
