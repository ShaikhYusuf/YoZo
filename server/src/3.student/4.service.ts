import { inject } from "inversify";
import TYPE from "../ioc/types";
import { container } from "../ioc/container";

import { IStudent } from "./0.model";
import { IServiceStudent } from "./3.service.model";
import { IRepoStudent } from "./5.repo.model";

export class ServiceStudentImpl implements IServiceStudent {
  private repoService!: IRepoStudent;

  constructor() {
    this.repoService = container.get(TYPE.RepoStudent);
  }

  async getAll(
    inSchoolId: number,
    inStandardId: number
  ): Promise<IStudent[] | null> {
    const retObject = await this.repoService.getAll(inSchoolId, inStandardId);
    return retObject;
  }

  async getByAdhaar(inAdhaar: string): Promise<IStudent | null> {
    const retObject = await this.repoService.getByAdhaar(inAdhaar);
    return retObject;
  }

  async get(inStudentId: number): Promise<IStudent | null> {
    const retObject = await this.repoService.getById(inStudentId);
    return retObject;
  }

  async create(inStudentInfo: IStudent): Promise<IStudent | null> {
    const retObject = await this.repoService.create(inStudentInfo);
    return retObject;
  }

  async update(inStudentId: number, inStudentInfo: IStudent): Promise<number> {
    const retObject = await this.repoService.update(inStudentId, inStudentInfo);
    return retObject;
  }

  async delete(inStudentId: number): Promise<number> {
    const retObject = await this.repoService.delete(inStudentId);
    return retObject;
  }
}
