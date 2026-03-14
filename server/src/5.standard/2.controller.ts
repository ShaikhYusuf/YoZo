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

import { IStandard } from "./0.model";
import { validateStandard } from "./1.validator";
import { IServiceStandard } from "./3.service.model";

@controller("/standard")
export class ControllerStandard extends BaseController {
  private logger: ILogger;
  private serviceStandard: IServiceStandard;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
    this.serviceStandard = container.get(TYPES.ServiceStandard);
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
      const standardList = await this.serviceStandard.getAll();
      this.logger.info("Retrieved standardList:" + standardList?.length);

      this.setCommonHeaders(res);
      if (!standardList) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "standardList not found" });
      }

      res.status(HttpStatusCode.OK).json(standardList);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:id", validateId)
  async get(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const standard = await this.serviceStandard.get(id);
      this.logger.info("Retrieved standard:" + standard);

      this.setCommonHeaders(res);
      if (!standard) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Standard not found" });
      }

      res.status(HttpStatusCode.OK).json(standard);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/", validateStandard)
  async create(@request() req: Request, @response() res: Response) {
    try {
      const status = await this.serviceStandard.create(req.body);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPut("/:id", validateId, validateStandard)
  async update(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const status = await this.serviceStandard.update(id, req.body);
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
      const status = await this.serviceStandard.delete(id);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }
}
