import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { ISchool } from "./0.model";
import { IRepoSchool } from "./5.repo.model";
import { DTOSchool } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoSchoolImpl implements IRepoSchool {
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

  async isExist(inSchoolId: number): Promise<boolean> {
    const SchoolModel = this.getModel(DTOSchool);
    const found = await SchoolModel.findOne({
      where: { Id: inSchoolId },
    });
    return found !== null;
  }

  async getAll(): Promise<ISchool[] | null> {
    const SchoolModel = this.getModel(DTOSchool);
    const foundObj = await SchoolModel.findAll<DTOSchool>();
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getById(inSchoolId: number): Promise<ISchool | null> {
    const SchoolModel = this.getModel(DTOSchool);
    const foundObj = await SchoolModel.findOne<DTOSchool>({
      where: { Id: inSchoolId },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async create(
    inSchool: Partial<ISchool>,
    transaction?: Transaction
  ): Promise<ISchool | null> {
    const SchoolModel = this.getModel(DTOSchool);
    const createdObj = await SchoolModel.create(inSchool, {
      transaction,
    });
    createdObj.dataValues.Id = createdObj.Id;
    return this.convertToObject(createdObj.dataValues);
  }

  async update(
    schoolId: number,
    inSchool: ISchool,
    transaction?: Transaction
  ): Promise<number> {
    const SchoolModel = this.getModel(DTOSchool);

    const [count] = await SchoolModel.update(inSchool, {
      where: { Id: schoolId },
      transaction,
    });

    return count;
  }

  async delete(inSchoolId: number, transaction?: Transaction): Promise<number> {
    const SchoolModel = this.getModel(DTOSchool);
    const count = await SchoolModel.destroy({
      where: { Id: inSchoolId },
      transaction,
    });
    return count;
  }

  convertToObject(srcObject: DTOSchool): ISchool {
    return {
      Id: srcObject.Id,
      name: srcObject.name,
      address: srcObject.address,
    };
  }
}
