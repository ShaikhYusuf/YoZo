import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { ILessonSection } from "./0.model";
import { IRepoLessonSection } from "./5.repo.model";
import { DTOLessonSection } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoLessonSectionImpl implements IRepoLessonSection {
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

  async isExist(inLessonSectionId: number): Promise<boolean> {
    const LessonSectionModel = this.getModel(DTOLessonSection);
    const found = await LessonSectionModel.findOne({
      where: { Id: inLessonSectionId },
    });
    return found !== null;
  }

  async getAll(
    inSubjectId: number,
    inLessonId: number
  ): Promise<ILessonSection[] | null> {
    const LessonSectionModel = this.getModel(DTOLessonSection);
    const foundObj = await LessonSectionModel.findAll<DTOLessonSection>({
      where: {
        subject: inSubjectId,
        lesson: inLessonId,
      },
    });
    return foundObj?.map((eachObj) =>
      this.convertToShortObject(eachObj.dataValues)
    );
  }

  async getById(inLessonSectionId: number): Promise<ILessonSection | null> {
    const LessonSectionModel = this.getModel(DTOLessonSection);
    const foundObj = await LessonSectionModel.findOne<DTOLessonSection>({
      where: { Id: inLessonSectionId },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async create(
    inLessonSection: Partial<ILessonSection>,
    transaction?: Transaction
  ): Promise<ILessonSection | null> {
    const LessonSectionModel = this.getModel(DTOLessonSection);
    const createdObj = await LessonSectionModel.create(inLessonSection, {
      transaction,
    });
    createdObj.dataValues.Id = createdObj.Id;
    return this.convertToObject(createdObj.dataValues);
  }

  async update(
    lessonId: number,
    inLessonSection: ILessonSection,
    transaction?: Transaction
  ): Promise<number> {
    const LessonSectionModel = this.getModel(DTOLessonSection);

    const [count] = await LessonSectionModel.update(inLessonSection, {
      where: { Id: lessonId },
      transaction,
    });

    return count;
  }

  async delete(
    inLessonSectionId: number,
    transaction?: Transaction
  ): Promise<number> {
    const LessonSectionModel = this.getModel(DTOLessonSection);
    const count = await LessonSectionModel.destroy({
      where: { Id: inLessonSectionId },
      transaction,
    });
    return count;
  }

  convertToObject(srcObject: DTOLessonSection): ILessonSection {
    return {
      Id: srcObject.Id,
      name: srcObject.name,
      explanation: srcObject.explanation,
      quiz: srcObject.quiz,
      fillblanks: srcObject.fillblanks,
      truefalse: srcObject.truefalse,
      subject: srcObject.subject,
      lesson: srcObject.lesson,
    };
  }

  convertToShortObject(srcObject: DTOLessonSection): ILessonSection {
    return {
      Id: srcObject.Id,
      name: srcObject.name,
      explanation: srcObject.explanation?.slice(0, 1000),
      quiz: srcObject.quiz?.slice(0, 1000),
      fillblanks: srcObject.fillblanks?.slice(0, 1000),
      truefalse: srcObject.truefalse?.slice(0, 1000),
      subject: srcObject.subject,
    };
  }
}
