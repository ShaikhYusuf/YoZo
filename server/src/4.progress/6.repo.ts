import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { IProgress } from "./0.model";
import { IRepoProgress } from "./5.repo.model";
import { DTOProgress } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoProgressImpl implements IRepoProgress {
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

  async isExist(inProgressId: number): Promise<boolean> {
    const ProgressModel = this.getModel(DTOProgress);
    const found = await ProgressModel.findOne({
      where: { Id: inProgressId },
    });
    return found !== null;
  }

  async isExistProgress(
    inSchoolId: number,
    inStandardId: number,
    inStudentId: number,
    inSubjectId: number,
    inLessonId: number,
    inLessonSectionId: number
  ): Promise<IProgress | null> {
    const ProgressModel = this.getModel(DTOProgress);
    const foundObj = await ProgressModel.findOne({
      where: {
        school: inSchoolId,
        standard: inStandardId,
        student: inStudentId,
        subject: inSubjectId,
        lesson: inLessonId,
        lessonsection: inLessonSectionId,
      },
    });

    return foundObj ? this.convertToObject(foundObj.dataValues) : null;
  }

  async getAllSchool(inSchoolId: number): Promise<IProgress[] | null> {
    const ProgressModel = this.getModel(DTOProgress);
    const foundObj = await ProgressModel.findAll<DTOProgress>({
      where: {
        school: inSchoolId,
      },
    });
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getAllStandard(
    inSchoolId: number,
    inStandardId: number
  ): Promise<IProgress[] | null> {
    const ProgressModel = this.getModel(DTOProgress);
    const foundObj = await ProgressModel.findAll<DTOProgress>({
      where: {
        school: inSchoolId,
        standard: inStandardId,
      },
    });
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getAllStudent(
    inSchoolId: number,
    inStandardId: number,
    inStudentId: number
  ): Promise<IProgress[] | null> {
    const ProgressModel = this.getModel(DTOProgress);
    const foundObj = await ProgressModel.findAll<DTOProgress>({
      where: {
        school: inSchoolId,
        standard: inStandardId,
        student: inStudentId,
      },
    });
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getById(inProgressId: number): Promise<IProgress | null> {
    const ProgressModel = this.getModel(DTOProgress);
    const foundObj = await ProgressModel.findOne<DTOProgress>({
      where: { Id: inProgressId },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async create(
    inProgress: Partial<IProgress>,
    transaction?: Transaction
  ): Promise<IProgress | null> {
    const ProgressModel = this.getModel(DTOProgress);
    const createdObj = await ProgressModel.create(inProgress, {
      transaction,
    });
    createdObj.dataValues.Id = createdObj.Id;
    return this.convertToObject(createdObj.dataValues);
  }

  async update(
    progressId: number,
    inProgress: IProgress,
    transaction?: Transaction
  ): Promise<number> {
    const ProgressModel = this.getModel(DTOProgress);

    const [count] = await ProgressModel.update(inProgress, {
      where: { Id: progressId },
      transaction,
    });

    return count;
  }

  async delete(
    inProgressId: number,
    transaction?: Transaction
  ): Promise<number> {
    const ProgressModel = this.getModel(DTOProgress);
    const count = await ProgressModel.destroy({
      where: { Id: inProgressId },
      transaction,
    });
    return count;
  }

  convertToObject(srcObject: DTOProgress): IProgress {
    return {
      Id: srcObject.Id,
      quiz: srcObject.quiz,
      fillblanks: srcObject.fillblanks,
      truefalse: srcObject.truefalse,
      school: srcObject.school,
      standard: srcObject.standard,
      student: srcObject.student,
      subject: srcObject.subject,
      lesson: srcObject.lesson,
      lessonsection: srcObject.lessonsection,
    };
  }
}
