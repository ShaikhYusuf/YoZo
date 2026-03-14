import { inject } from "inversify";
import TYPE from "../ioc/types";
import { container } from "../ioc/container";

import { ISchool } from "./0.model";
import { IServiceSchool } from "./3.service.model";
import { IRepoSchool } from "./5.repo.model";

export class ServiceSchoolImpl implements IServiceSchool {
  private repoService!: IRepoSchool;

  constructor() {
    this.repoService = container.get(TYPE.RepoSchool);
  }

  async getAll(): Promise<ISchool[] | null> {
    const retObject = await this.repoService.getAll();
    return retObject;
  }

  async get(inSchoolId: number): Promise<ISchool | null> {
    const retObject = await this.repoService.getById(inSchoolId);
    return retObject;
  }

  async create(inSchoolInfo: ISchool): Promise<ISchool | null> {
    const retObject = await this.repoService.create(inSchoolInfo);
    return retObject;
  }

  async update(inSchoolId: number, inSchoolInfo: ISchool): Promise<number> {
    const retObject = await this.repoService.update(inSchoolId, inSchoolInfo);
    return retObject;
  }

  async delete(inSchoolId: number): Promise<number> {
    const retObject = await this.repoService.delete(inSchoolId);
    return retObject;
  }
}
