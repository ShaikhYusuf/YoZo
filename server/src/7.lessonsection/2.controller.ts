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

import { ILessonSection } from "./0.model";
import { validateLessonSection } from "./1.validator";
import { IServiceLessonSection } from "./3.service.model";

@controller("/lessonsection")
export class ControllerLessonSection extends BaseController {
  private logger: ILogger;
  private serviceLessonSection: IServiceLessonSection;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
    this.serviceLessonSection = container.get(TYPES.ServiceLessonSection);
  }

  private setCommonHeaders(res: Response) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000, includeSubDomains"
    );
  }

  @httpGet("/:Id/explanation")
  async getExplanation(@request() req: Request, @response() res: Response) {
    try {
      const lessonSectionId = +req.params.Id;
      const lessonSection = await this.serviceLessonSection.get(
        lessonSectionId
      );
      this.logger.info("Retrieved Explanation:" + lessonSection?.explanation);

      this.setCommonHeaders(res);
      if (!lessonSection?.explanation) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "lessonList not found" });
      }

      res.status(HttpStatusCode.OK).json(lessonSection?.explanation);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:Id/quiz")
  async getQuiz(@request() req: Request, @response() res: Response) {
    try {
      const lessonSectionId = +req.params.Id;
      const lessonSection = await this.serviceLessonSection.get(
        lessonSectionId
      );
      this.logger.info("Retrieved Explanation:" + lessonSection?.quiz);

      this.setCommonHeaders(res);
      if (!lessonSection?.quiz) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "lessonList not found" });
      }

      res.status(HttpStatusCode.OK).json(lessonSection?.quiz);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:Id/fillblank")
  async getFillBlank(@request() req: Request, @response() res: Response) {
    try {
      const lessonSectionId = +req.params.Id;
      const lessonSection = await this.serviceLessonSection.get(
        lessonSectionId
      );
      this.logger.info("Retrieved Explanation:" + lessonSection?.fillblanks);

      this.setCommonHeaders(res);
      if (!lessonSection?.fillblanks) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "lessonList not found" });
      }

      res.status(HttpStatusCode.OK).json(lessonSection?.fillblanks);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:Id/truefalse")
  async getTrueFalse(@request() req: Request, @response() res: Response) {
    try {
      const lessonSectionId = +req.params.Id;
      const lessonSection = await this.serviceLessonSection.get(
        lessonSectionId
      );
      this.logger.info("Retrieved Explanation:" + lessonSection?.truefalse);

      this.setCommonHeaders(res);
      if (!lessonSection?.truefalse) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "lessonList not found" });
      }

      res.status(HttpStatusCode.OK).json(lessonSection?.truefalse);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/subject/:subjectId/lesson/:lessonId/")
  async getAll(@request() req: Request, @response() res: Response) {
    try {
      const subjectId = +req.params.subjectId;
      const lessonId = +req.params.lessonId;
      const lessonSectionList = await this.serviceLessonSection.getAll(
        subjectId,
        lessonId
      );
      this.logger.info("Retrieved lessonList:" + lessonSectionList?.length);

      this.setCommonHeaders(res);
      if (!lessonSectionList) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "lessonList not found" });
      }

      res.status(HttpStatusCode.OK).json(lessonSectionList);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:id", validateId)
  async get(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const lessonSection = await this.serviceLessonSection.get(id);
      this.logger.info("Retrieved lesson:" + lessonSection);

      this.setCommonHeaders(res);
      if (!lessonSection) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Lesson not found" });
      }

      res.status(HttpStatusCode.OK).json(lessonSection);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/", validateLessonSection)
  async create(@request() req: Request, @response() res: Response) {
    try {
      const status = await this.serviceLessonSection.create(req.body);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPut("/:id", validateId, validateLessonSection)
  async update(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const status = await this.serviceLessonSection.update(id, req.body);
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
      const status = await this.serviceLessonSection.delete(id);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }
}
