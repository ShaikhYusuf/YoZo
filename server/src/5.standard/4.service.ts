import { inject } from "inversify";
import TYPE from "../ioc/types";
import { container } from "../ioc/container";

import { IStandard } from "./0.model";
import { IServiceStandard } from "./3.service.model";
import { IRepoStandard } from "./5.repo.model";

export class ServiceStandardImpl implements IServiceStandard {
  private repoService!: IRepoStandard;

  constructor() {
    this.repoService = container.get(TYPE.RepoStandard);
  }

  async getAll(): Promise<IStandard[] | null> {
    const retObject = await this.repoService.getAll();
    return retObject;
  }

  async get(inStandardId: number): Promise<IStandard | null> {
    const retObject = await this.repoService.getById(inStandardId);
    return retObject;
  }

  async create(inStandardInfo: IStandard): Promise<IStandard | null> {
    const retObject = await this.repoService.create(inStandardInfo);
    return retObject;
  }

  async update(
    inStandardId: number,
    inStandardInfo: IStandard
  ): Promise<number> {
    const retObject = await this.repoService.update(
      inStandardId,
      inStandardInfo
    );
    return retObject;
  }

  async delete(inStandardId: number): Promise<number> {
    const retObject = await this.repoService.delete(inStandardId);
    return retObject;
  }
}
