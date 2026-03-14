import { IGamification } from "./0.model";

export interface IRepoGamification {
  get(id: number): Promise<IGamification>;
  getByStudent(studentId: number): Promise<IGamification>;
  create(studentId: number): Promise<IGamification>;
  update(id: number, data: Partial<IGamification>): Promise<IGamification>;
}
