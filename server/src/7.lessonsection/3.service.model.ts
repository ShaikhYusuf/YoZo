import { ILessonSection } from "./0.model";

export interface IServiceLessonSection {
  getAll(
    inSubjectId: number,
    inLessonId: number
  ): Promise<ILessonSection[] | null>;
  get(inLessonSectionId: number): Promise<ILessonSection | null>;
  create(inLessonSectionInfo: ILessonSection): Promise<ILessonSection | null>;
  update(inLessonSectionId: number, inLesson: ILessonSection): Promise<number>;
  delete(inLessonSectionId: number): Promise<number>;
}
