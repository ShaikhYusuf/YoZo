import { ILoginDetail } from "./0.model";

export interface IServiceLoginDetail {
  getAll(): Promise<ILoginDetail[] | null>;
  get(inLoginDetailId: number): Promise<ILoginDetail | null>;
  validate(username: string, password: string): Promise<ILoginDetail | null>;
  getByName(inLoginDetailUsername: string): Promise<ILoginDetail | null>;
  create(inLoginDetailInfo: ILoginDetail): Promise<ILoginDetail | null>;
  update(
    inLoginDetailId: number,
    inLoginDetailInfo: ILoginDetail
  ): Promise<number>;
  delete(inLoginDetailId: number): Promise<number>;
}
