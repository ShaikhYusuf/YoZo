import { ISubject } from "./0.model";

export interface IServiceSubject {
  getAll(inStandardId: number): Promise<ISubject[] | null>;
  get(inSubjectId: number): Promise<ISubject | null>;
  create(inSubjectInfo: ISubject): Promise<ISubject | null>;
  update(inSubjectId: number, inSubjectInfo: ISubject): Promise<number>;
  delete(inSubjectId: number): Promise<number>;
}
