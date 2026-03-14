import { inject } from "inversify";
import bcrypt from "bcryptjs";
import TYPE from "../ioc/types";
import { container } from "../ioc/container";

import { ILoginDetail } from "./0.model";
import { IServiceLoginDetail } from "./3.service.model";
import { IRepoLoginDetail } from "./5.repo.model";

export class ServiceLoginDetailImpl implements IServiceLoginDetail {
  private repoService!: IRepoLoginDetail;

  constructor() {
    this.repoService = container.get(TYPE.RepoLoginDetail);
  }

  async getAll(): Promise<ILoginDetail[] | null> {
    const retObject = await this.repoService.getAll();
    return retObject;
  }

  async get(inLoginDetailId: number): Promise<ILoginDetail | null> {
    const retObject = await this.repoService.getById(inLoginDetailId);
    return retObject;
  }

  async getByName(inLoginDetailUsername: string): Promise<ILoginDetail | null> {
    const retObject = await this.repoService.getByName(inLoginDetailUsername);
    return retObject;
  }

  async validate(
    username: string,
    password: string
  ): Promise<ILoginDetail | null> {
    const retObject = await this.repoService.getByName(username);
    if (!retObject) return null;

    // Use bcrypt to compare password securely
    const isMatch = await bcrypt.compare(password, retObject.password);
    return isMatch ? retObject : null;
  }

  async create(inLoginDetailInfo: ILoginDetail): Promise<ILoginDetail | null> {
    // Hash password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(inLoginDetailInfo.password, salt);
    const userToCreate = { ...inLoginDetailInfo, password: hashedPassword };

    const retObject = await this.repoService.create(userToCreate);
    return retObject;
  }

  async update(
    inLoginDetailId: number,
    inLoginDetailInfo: ILoginDetail
  ): Promise<number> {
    // Hash password if it's being updated
    if (inLoginDetailInfo.password) {
      const salt = await bcrypt.genSalt(10);
      inLoginDetailInfo.password = await bcrypt.hash(inLoginDetailInfo.password, salt);
    }

    const retObject = await this.repoService.update(
      inLoginDetailId,
      inLoginDetailInfo
    );
    return retObject;
  }

  async delete(inLoginDetailId: number): Promise<number> {
    const retObject = await this.repoService.delete(inLoginDetailId);
    return retObject;
  }
}

