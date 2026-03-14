import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { IStudent } from "./0.model";
import { IRepoStudent } from "./5.repo.model";
import { DTOStudent } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoStudentImpl implements IRepoStudent {
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

  async isExist(inStudentId: number): Promise<boolean> {
    const StudentModel = this.getModel(DTOStudent);
    const found = await StudentModel.findOne({
      where: { Id: inStudentId },
    });
    return found !== null;
  }

  async getAll(
    inSchoolId: number,
    inStandardId: number
  ): Promise<IStudent[] | null> {
    const StudentModel = this.getModel(DTOStudent);
    const foundObj = await StudentModel.findAll<DTOStudent>({
      where: { school: inSchoolId, standard: inStandardId },
    });
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getById(inStudentId: number): Promise<IStudent | null> {
    const StudentModel = this.getModel(DTOStudent);
    const foundObj = await StudentModel.findOne<DTOStudent>({
      where: { Id: inStudentId },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async getByAdhaar(inAdhaar: string): Promise<IStudent | null> {
    const StudentModel = this.getModel(DTOStudent);
    const foundObj = await StudentModel.findOne<DTOStudent>({
      where: { adhaar: inAdhaar },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async create(
    inStudent: Partial<IStudent>,
    transaction?: Transaction
  ): Promise<IStudent | null> {
    const StudentModel = this.getModel(DTOStudent);
    const createdObj = await StudentModel.create(inStudent, {
      transaction,
    });
    createdObj.dataValues.Id = createdObj.Id;
    return this.convertToObject(createdObj.dataValues);
  }

  async update(
    studentId: number,
    inStudent: IStudent,
    transaction?: Transaction
  ): Promise<number> {
    const StudentModel = this.getModel(DTOStudent);

    const [count] = await StudentModel.update(inStudent, {
      where: { Id: studentId },
      transaction,
    });

    return count;
  }

  async delete(
    inStudentId: number,
    transaction?: Transaction
  ): Promise<number> {
    const StudentModel = this.getModel(DTOStudent);
    const count = await StudentModel.destroy({
      where: { Id: inStudentId },
      transaction,
    });
    return count;
  }

  convertToObject(srcObject: DTOStudent): IStudent {
    return {
      Id: srcObject.Id,
      name: srcObject.name,
      adhaar: srcObject.adhaar,
      school: srcObject.school,
      standard: srcObject.standard,
    };
  }
}
