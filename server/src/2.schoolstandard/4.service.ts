import { inject } from "inversify";
import TYPE from "../ioc/types";
import { container } from "../ioc/container";

import { ISchoolStandard } from "./0.model";
import { IServiceSchoolStandard } from "./3.service.model";
import { IRepoSchoolStandard } from "./5.repo.model";

export class ServiceSchoolStandardImpl implements IServiceSchoolStandard {
  private repoService!: IRepoSchoolStandard;

  constructor() {
    this.repoService = container.get(TYPE.RepoSchoolStandard);
  }

  async getAll(inSchoolId: number): Promise<ISchoolStandard[] | null> {
    const retObject = await this.repoService.getAll(inSchoolId);
    return retObject;
  }

  async get(inSchoolStandardId: number): Promise<ISchoolStandard | null> {
    const retObject = await this.repoService.getById(inSchoolStandardId);
    return retObject;
  }

  async create(
    inSchoolStandardInfo: ISchoolStandard
  ): Promise<ISchoolStandard | null> {
    const retObject = await this.repoService.create(inSchoolStandardInfo);
    return retObject;
  }

  async update(
    inSchoolStandardId: number,
    inSchoolStandardInfo: ISchoolStandard
  ): Promise<number> {
    const retObject = await this.repoService.update(
      inSchoolStandardId,
      inSchoolStandardInfo
    );
    return retObject;
  }

  async delete(inSchoolStandardId: number): Promise<number> {
    const retObject = await this.repoService.delete(inSchoolStandardId);
    return retObject;
  }
}
