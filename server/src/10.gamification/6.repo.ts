import { Model, Sequelize, Transaction } from "sequelize";
import { injectable } from "inversify";
import { IGamification } from "./0.model";
import { IRepoGamification } from "./5.repo.model";
import { DTOGamification } from "./7.dto.model";
import { RequestContextProvider } from "../common/service/request-context.service";
import { container } from "../ioc/container";

@injectable()
export class RepoGamificationImpl implements IRepoGamification {
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

  async get(id: number): Promise<IGamification> {
    const GamificationModel = this.getModel(DTOGamification);
    const found = await GamificationModel.findOne({ where: { Id: id } });
    if (!found) throw new Error("Gamification record not found");
    return this.convertToObject(found as unknown as DTOGamification);
  }

  async getByStudent(studentId: number): Promise<IGamification> {
    const GamificationModel = this.getModel(DTOGamification);
    const found = await GamificationModel.findOne({ where: { studentId } });
    if (!found) throw new Error("Gamification record not found for student");
    return this.convertToObject(found as unknown as DTOGamification);
  }

  async create(studentId: number): Promise<IGamification> {
    const GamificationModel = this.getModel(DTOGamification);
    const created = await GamificationModel.create({
      studentId,
      xp: 0,
      level: 1,
      badges: [],
      streakDays: 0,
      lastActive: new Date()
    });
    created.dataValues.Id = (created as any).Id;
    return this.convertToObject(created.dataValues as DTOGamification);
  }

  async update(id: number, data: Partial<IGamification>): Promise<IGamification> {
    const GamificationModel = this.getModel(DTOGamification);
    await GamificationModel.update(data, { where: { Id: id } });
    return this.get(id);
  }

  convertToObject(srcObject: DTOGamification): IGamification {
    return {
      Id: srcObject.Id,
      studentId: srcObject.studentId,
      xp: srcObject.xp,
      level: srcObject.level,
      badges: srcObject.badges,
      streakDays: srcObject.streakDays,
      lastActive: srcObject.lastActive,
    };
  }
}
