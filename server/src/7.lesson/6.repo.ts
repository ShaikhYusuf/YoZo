import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { ILesson } from "./0.model";
import { IRepoLesson } from "./5.repo.model";
import { DTOLesson } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoLessonImpl implements IRepoLesson {
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

  async isExist(inLessonId: number): Promise<boolean> {
    const LessonModel = this.getModel(DTOLesson);
    const found = await LessonModel.findOne({
      where: { Id: inLessonId },
    });
    return found !== null;
  }

  async getAll(inSubjectId: number): Promise<ILesson[] | null> {
    const LessonModel = this.getModel(DTOLesson);
    const foundObj = await LessonModel.findAll<DTOLesson>({
      where: { subject: inSubjectId },
    });
    return foundObj?.map((eachObj) => this.convertToObject(eachObj.dataValues));
  }

  async getById(inLessonId: number): Promise<ILesson | null> {
    const LessonModel = this.getModel(DTOLesson);
    const foundObj = await LessonModel.findOne<DTOLesson>({
      where: { Id: inLessonId },
    });
    if (foundObj?.dataValues) {
      return this.convertToObject(foundObj?.dataValues);
    }
    return null;
  }

  async create(
    inLesson: Partial<ILesson>,
    transaction?: Transaction
  ): Promise<ILesson | null> {
    const LessonModel = this.getModel(DTOLesson);
    const createdObj = await LessonModel.create(inLesson, {
      transaction,
    });
    createdObj.dataValues.Id = createdObj.Id;
    return this.convertToObject(createdObj.dataValues);
  }

  async update(
    lessonId: number,
    inLesson: ILesson,
    transaction?: Transaction
  ): Promise<number> {
    const LessonModel = this.getModel(DTOLesson);

    const [count] = await LessonModel.update(inLesson, {
      where: { Id: lessonId },
      transaction,
    });

    return count;
  }

  async delete(inLessonId: number, transaction?: Transaction): Promise<number> {
    const LessonModel = this.getModel(DTOLesson);
    const count = await LessonModel.destroy({
      where: { Id: inLessonId },
      transaction,
    });
    return count;
  }

  convertToObject(srcObject: DTOLesson): ILesson {
    return {
      Id: srcObject.Id,
      name: srcObject.name,
      subject: srcObject.subject,
    };
  }
}
