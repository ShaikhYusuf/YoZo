import { IGamification } from "./0.model";

export interface IServiceGamification {
  get(id: number): Promise<IGamification>;
  getByStudent(studentId: number): Promise<IGamification>;
  addXp(studentId: number, xpToAdd: number): Promise<IGamification>;
  awardBadge(studentId: number, badge: string): Promise<IGamification>;
  updateStreak(studentId: number): Promise<IGamification>;
}
