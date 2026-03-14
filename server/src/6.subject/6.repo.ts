import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { ISubject } from "./0.model";
import { IRepoSubject } from "./5.repo.model";
import { DTOSubject } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoSubjectImpl implements IRepoSubject {
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

  async isExist(inSubjectId: number): Promise<boolean> {
    const SubjectModel = this.getModel(DTOSubject);
    const found = await SubjectModel.findOne({
      where: { Id: inSubjectId },
    });
    return found !== null;
  }

  async getAll(inStandardId: number): Promise<ISubject[] | null> {
    const SubjectModel = this.getModel(DTOSubject);
    const foundObj = await SubjectModel.findAll<DTOSubject>({
      where: { standard: inStandardId },
    });
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getById(inSubjectId: number): Promise<ISubject | null> {
    const SubjectModel = this.getModel(DTOSubject);
    const foundObj = await SubjectModel.findOne<DTOSubject>({
      where: { Id: inSubjectId },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async create(
    inSubject: Partial<ISubject>,
    transaction?: Transaction
  ): Promise<ISubject | null> {
    const SubjectModel = this.getModel(DTOSubject);
    const createdObj = await SubjectModel.create(inSubject, {
      transaction,
    });
    createdObj.dataValues.Id = createdObj.Id;
    return this.convertToObject(createdObj.dataValues);
  }

  async update(
    subjectId: number,
    inSubject: ISubject,
    transaction?: Transaction
  ): Promise<number> {
    const SubjectModel = this.getModel(DTOSubject);

    const [count] = await SubjectModel.update(inSubject, {
      where: { Id: subjectId },
      transaction,
    });

    return count;
  }

  async delete(
    inSubjectId: number,
    transaction?: Transaction
  ): Promise<number> {
    const SubjectModel = this.getModel(DTOSubject);
    const count = await SubjectModel.destroy({
      where: { Id: inSubjectId },
      transaction,
    });
    return count;
  }

  convertToObject(srcObject: DTOSubject): ISubject {
    return {
      Id: srcObject.Id,
      name: srcObject.name,
      standard: srcObject.standard,
    };
  }
}
