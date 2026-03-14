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

import { ISubject } from "./0.model";
import { validateSubject } from "./1.validator";
import { IServiceSubject } from "./3.service.model";

@controller("/subject")
export class ControllerSubject extends BaseController {
  private logger: ILogger;
  private serviceSubject: IServiceSubject;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
    this.serviceSubject = container.get(TYPES.ServiceSubject);
  }

  private setCommonHeaders(res: Response) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000, includeSubDomains"
    );
  }

  @httpGet("/standard/:Id")
  async getAll(@request() req: Request, @response() res: Response) {
    try {
      const standardId = +req.params.Id;
      const subjectList = await this.serviceSubject.getAll(standardId);
      this.logger.info("Retrieved subjectList:" + subjectList?.length);

      this.setCommonHeaders(res);
      if (!subjectList) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "subjectList not found" });
      }

      res.status(HttpStatusCode.OK).json(subjectList);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:id", validateId)
  async get(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const subject = await this.serviceSubject.get(id);
      this.logger.info("Retrieved subject:" + subject);

      this.setCommonHeaders(res);
      if (!subject) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Subject not found" });
      }

      res.status(HttpStatusCode.OK).json(subject);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/", validateSubject)
  async create(@request() req: Request, @response() res: Response) {
    try {
      const status = await this.serviceSubject.create(req.body);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPut("/:id", validateId, validateSubject)
  async update(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const status = await this.serviceSubject.update(id, req.body);
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
      const status = await this.serviceSubject.delete(id);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }
}
