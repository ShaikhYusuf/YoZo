import { IProgress } from "./0.model";

export interface IServiceProgress {
  getAllSchool(inSchoolId: number): Promise<IProgress[] | null>;
  getAllStandard(
    inSchoolId: number,
    inStandardId: number
  ): Promise<IProgress[] | null>;
  getAllStudent(
    inSchoolId: number,
    inStandardId: number,
    inStudentId: number
  ): Promise<IProgress[] | null>;
  get(inProgressId: number): Promise<IProgress | null>;
  create(inProgressInfo: IProgress): Promise<IProgress | null>;
  update(inProgressId: number, inProgressInfo: IProgress): Promise<number>;
  delete(inProgressId: number): Promise<number>;
  
  getSchoolSummary(inSchoolId: number): Promise<any>;
  getStandardSummary(inSchoolId: number, inStandardId: number): Promise<any>;
}
