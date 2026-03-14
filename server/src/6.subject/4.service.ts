import { inject } from "inversify";
import TYPE from "../ioc/types";
import { container } from "../ioc/container";

import { ISubject } from "./0.model";
import { IServiceSubject } from "./3.service.model";
import { IRepoSubject } from "./5.repo.model";

export class ServiceSubjectImpl implements IServiceSubject {
  private repoService!: IRepoSubject;

  constructor() {
    this.repoService = container.get(TYPE.RepoSubject);
  }

  async getAll(inStandardId: number): Promise<ISubject[] | null> {
    const retObject = await this.repoService.getAll(inStandardId);
    return retObject;
  }

  async get(inSubjectId: number): Promise<ISubject | null> {
    const retObject = await this.repoService.getById(inSubjectId);
    return retObject;
  }

  async create(inSubjectInfo: ISubject): Promise<ISubject | null> {
    const retObject = await this.repoService.create(inSubjectInfo);
    return retObject;
  }

  async update(inSubjectId: number, inSubjectInfo: ISubject): Promise<number> {
    const retObject = await this.repoService.update(inSubjectId, inSubjectInfo);
    return retObject;
  }

  async delete(inSubjectId: number): Promise<number> {
    const retObject = await this.repoService.delete(inSubjectId);
    return retObject;
  }
}
