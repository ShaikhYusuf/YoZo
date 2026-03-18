import { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpGet,
  httpPost,
  httpDelete,
  request,
  response,
  httpPut,
} from "inversify-express-utils";

import { ILogger } from "../common/service/logger.service";
import TYPES from "../ioc/types";
import { container } from "../ioc/container";

import { BaseController } from "../common/base-controller";
import { HttpStatusCode } from "../common/constant/http-status-code";
import { validateId } from "../common/validator-id";

import { IProgress } from "./0.model";
import { validateProgress } from "./1.validator";
import { IServiceProgress } from "./3.service.model";

@controller("/progress")
export class ControllerProgress extends BaseController {
  private logger: ILogger;
  private serviceProgress: IServiceProgress;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
    this.serviceProgress = container.get(TYPES.ServiceProgress);
  }

  private setCommonHeaders(res: Response) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000, includeSubDomains"
    );
  }

  @httpGet("/school/:schoolId")
  async getAllSchool(@request() req: Request, @response() res: Response) {
    try {
      const schoolId = +req.params.schoolId;
      const progressList = await this.serviceProgress.getAllSchool(schoolId);
      this.logger.info("Retrieved progressList:" + progressList?.length);

      this.setCommonHeaders(res);
      if (!progressList) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "progressList not found" });
      }

      res.status(HttpStatusCode.OK).json(progressList);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/school/:schoolId/standard/:standardId")
  async getAllStandard(@request() req: Request, @response() res: Response) {
    try {
      const schoolId = +req.params.schoolId;
      const standardId = +req.params.standardId;
      const progressList = await this.serviceProgress.getAllStandard(
        schoolId,
        standardId
      );
      this.logger.info("Retrieved progressList:" + progressList?.length);

      this.setCommonHeaders(res);
      if (!progressList) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "progressList not found" });
      }

      res.status(HttpStatusCode.OK).json(progressList);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/school/:schoolId/summary")
  async getSchoolSummary(@request() req: Request, @response() res: Response) {
    try {
      const schoolId = +req.params.schoolId;
      const summary = await this.serviceProgress.getSchoolSummary(schoolId);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(summary);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/school/:schoolId/standard/:standardId/summary")
  async getStandardSummary(@request() req: Request, @response() res: Response) {
    try {
      const schoolId = +req.params.schoolId;
      const standardId = +req.params.standardId;
      const summary = await this.serviceProgress.getStandardSummary(schoolId, standardId);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(summary);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/school/:schoolId/standard/:standardId/student/:studentId")
  async getAllStudent(@request() req: Request, @response() res: Response) {
    try {
      const schoolId = +req.params.schoolId;
      const standardId = +req.params.standardId;
      const studentId = +req.params.studentId;
      const progressList = await this.serviceProgress.getAllStudent(
        schoolId,
        standardId,
        studentId
      );
      this.logger.info("Retrieved progressList:" + progressList?.length);

      this.setCommonHeaders(res);
      if (!progressList) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "progressList not found" });
      }

      res.status(HttpStatusCode.OK).json(progressList);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:id", validateId)
  async get(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const progress = await this.serviceProgress.get(id);
      this.logger.info("Retrieved progress:" + progress);

      this.setCommonHeaders(res);
      if (!progress) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Progress not found" });
      }

      res.status(HttpStatusCode.OK).json(progress);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/", validateProgress)
  async create(@request() req: Request, @response() res: Response) {
    try {
      const status = await this.serviceProgress.create(req.body);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPut("/:id", validateId, validateProgress)
  async update(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const status = await this.serviceProgress.update(id, req.body);
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
      const status = await this.serviceProgress.delete(id);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }
}
