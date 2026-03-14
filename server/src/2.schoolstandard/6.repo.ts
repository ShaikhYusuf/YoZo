import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { ISchoolStandard } from "./0.model";
import { IRepoSchoolStandard } from "./5.repo.model";
import { DTOSchoolStandard } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoSchoolStandardImpl implements IRepoSchoolStandard {
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

  async isExist(inSchoolStandardId: number): Promise<boolean> {
    const SchoolStandardModel = this.getModel(DTOSchoolStandard);
    const found = await SchoolStandardModel.findOne({
      where: { Id: inSchoolStandardId },
    });
    return found !== null;
  }

  async getAll(inSchoolId: number): Promise<ISchoolStandard[] | null> {
    const SchoolStandardModel = this.getModel(DTOSchoolStandard);
    const foundObj = await SchoolStandardModel.findAll<DTOSchoolStandard>({
      where: { school: inSchoolId },
    });
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getById(inSchoolStandardId: number): Promise<ISchoolStandard | null> {
    const SchoolStandardModel = this.getModel(DTOSchoolStandard);
    const foundObj = await SchoolStandardModel.findOne<DTOSchoolStandard>({
      where: { Id: inSchoolStandardId },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async create(
    inSchoolStandard: Partial<ISchoolStandard>,
    transaction?: Transaction
  ): Promise<ISchoolStandard | null> {
    const SchoolStandardModel = this.getModel(DTOSchoolStandard);
    const createdObj = await SchoolStandardModel.create(inSchoolStandard, {
      transaction,
    });
    createdObj.dataValues.Id = createdObj.Id;
    return this.convertToObject(createdObj.dataValues);
  }

  async update(
    schoolstandardId: number,
    inSchoolStandard: ISchoolStandard,
    transaction?: Transaction
  ): Promise<number> {
    const SchoolStandardModel = this.getModel(DTOSchoolStandard);

    const [count] = await SchoolStandardModel.update(inSchoolStandard, {
      where: { Id: schoolstandardId },
      transaction,
    });

    return count;
  }

  async delete(
    inSchoolStandardId: number,
    transaction?: Transaction
  ): Promise<number> {
    const SchoolStandardModel = this.getModel(DTOSchoolStandard);
    const count = await SchoolStandardModel.destroy({
      where: { Id: inSchoolStandardId },
      transaction,
    });
    return count;
  }

  convertToObject(srcObject: DTOSchoolStandard): ISchoolStandard {
    return {
      Id: srcObject.Id,
      school: srcObject.school,
      standard: srcObject.standard,
    };
  }
}
