import { ISchool } from "./0.model";

export interface IServiceSchool {
  getAll(): Promise<ISchool[] | null>;
  get(inSchoolId: number): Promise<ISchool | null>;
  create(inSchoolInfo: ISchool): Promise<ISchool | null>;
  update(inSchoolId: number, inSchoolInfo: ISchool): Promise<number>;
  delete(inSchoolId: number): Promise<number>;
}
