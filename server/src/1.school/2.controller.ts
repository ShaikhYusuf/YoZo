import { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpGet,
  httpPost,
  httpPatch,
  httpDelete,
  request,
  response,
  httpPut,
} from "inversify-express-utils";

import { ILogger, LoggerService } from "../common/service/logger.service";
import TYPES from "../ioc/types";
import { container } from "../ioc/container";

import { BaseController } from "../common/base-controller";
import { HttpStatusCode } from "../common/constant/http-status-code";
import { validateId } from "../common/validator-id";

import { ISchool } from "./0.model";
import { validateSchool } from "./1.validator";
import { IServiceSchool } from "./3.service.model";

@controller("/school")
export class ControllerSchool extends BaseController {
  private logger: ILogger;
  private serviceSchool: IServiceSchool;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
    this.serviceSchool = container.get(TYPES.ServiceSchool);
  }

  private setCommonHeaders(res: Response) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000, includeSubDomains"
    );
  }

  @httpGet("/")
  async getAll(@request() req: Request, @response() res: Response) {
    try {
      const schoolList = await this.serviceSchool.getAll();
      this.logger.info("Retrieved schoolList:" + schoolList?.length);

      this.setCommonHeaders(res);
      if (!schoolList) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "schoolList not found" });
      }

      res.status(HttpStatusCode.OK).json(schoolList);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:id", validateId)
  async get(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const school = await this.serviceSchool.get(id);
      this.logger.info("Retrieved school:" + school);

      this.setCommonHeaders(res);
      if (!school) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "School not found" });
      }

      res.status(HttpStatusCode.OK).json(school);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/", validateSchool)
  async create(@request() req: Request, @response() res: Response) {
    try {
      const status = await this.serviceSchool.create(req.body);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPut("/:id", validateId, validateSchool)
  async update(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const status = await this.serviceSchool.update(id, req.body);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpDelete("/:id", validateId)
  async delete(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const status = await this.serviceSchool.delete(id);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }
}
