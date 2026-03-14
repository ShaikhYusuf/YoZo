import { ISchoolStandard } from "./0.model";

export interface IServiceSchoolStandard {
  getAll(inSchoolId: number): Promise<ISchoolStandard[] | null>;
  get(inSchoolStandardId: number): Promise<ISchoolStandard | null>;
  create(
    inSchoolStandardInfo: ISchoolStandard
  ): Promise<ISchoolStandard | null>;
  update(
    inSchoolStandardId: number,
    inSchoolStandardInfo: ISchoolStandard
  ): Promise<number>;
  delete(inSchoolStandardId: number): Promise<number>;
}
