import { ILesson } from "./0.model";

export interface IServiceLesson {
  getAll(inSubjectId: number): Promise<ILesson[] | null>;
  get(inLessonId: number): Promise<ILesson | null>;
  create(inLessonInfo: ILesson): Promise<ILesson | null>;
  update(inLessonId: number, inLessonInfo: ILesson): Promise<number>;
  delete(inLessonId: number): Promise<number>;
}
