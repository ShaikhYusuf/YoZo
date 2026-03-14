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

import { ISchoolStandard } from "./0.model";
import { validateSchoolStandard } from "./1.validator";
import { IServiceSchoolStandard } from "./3.service.model";

@controller("/schoolstandard")
export class ControllerSchoolStandard extends BaseController {
  private logger: ILogger;
  private serviceSchoolStandard: IServiceSchoolStandard;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
    this.serviceSchoolStandard = container.get(TYPES.ServiceSchoolStandard);
  }

  private setCommonHeaders(res: Response) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000, includeSubDomains"
    );
  }

  @httpGet("/school/:Id")
  async getAll(@request() req: Request, @response() res: Response) {
    try {
      const schoolId = +req.params.Id;
      const schoolstandardList = await this.serviceSchoolStandard.getAll(
        schoolId
      );
      this.logger.info(
        "Retrieved schoolstandardList:" + schoolstandardList?.length
      );

      this.setCommonHeaders(res);
      if (!schoolstandardList) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "schoolstandardList not found" });
      }

      res.status(HttpStatusCode.OK).json(schoolstandardList);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:id", validateId)
  async get(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const schoolstandard = await this.serviceSchoolStandard.get(id);
      this.logger.info("Retrieved schoolstandard:" + schoolstandard);

      this.setCommonHeaders(res);
      if (!schoolstandard) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "SchoolStandard not found" });
      }

      res.status(HttpStatusCode.OK).json(schoolstandard);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/", validateSchoolStandard)
  async create(@request() req: Request, @response() res: Response) {
    try {
      const status = await this.serviceSchoolStandard.create(req.body);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPut("/:id", validateId, validateSchoolStandard)
  async update(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const status = await this.serviceSchoolStandard.update(id, req.body);
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
      const status = await this.serviceSchoolStandard.delete(id);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }
}
