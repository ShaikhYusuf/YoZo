import { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpGet,
  httpPost,
  request,
  response,
} from "inversify-express-utils";

import { BaseController } from "../common/base-controller";
import { HttpStatusCode } from "../common/constant/http-status-code";
import { ILogger } from "../common/service/logger.service";
import TYPES from "../ioc/types";
import { container } from "../ioc/container";
import { IServiceGamification } from "./3.service.model";
import { validateStudentId, validateXpData, validateBadgeData } from "./1.validator";
import { requireAuth } from "../common/middleware/auth-guard";

@controller("/gamification")
export class ControllerGamification extends BaseController {
  private serviceGamification: IServiceGamification;
  private logger: ILogger;

  constructor() {
    super();
    this.serviceGamification = container.get<IServiceGamification>(TYPES.ServiceGamification);
    this.logger = container.get<ILogger>(TYPES.LoggerService);
  }

  private setCommonHeaders(res: Response) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000, includeSubDomains"
    );
  }

  @httpGet("/student/:studentId", requireAuth, validateStudentId)
  async getByStudent(@request() req: Request, @response() res: Response) {
    try {
      const studentId = parseInt(req.params.studentId, 10);
      const profile = await this.serviceGamification.getByStudent(studentId);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(profile);
    } catch (error: any) {
      this.logger.error("Error fetching gamification profile: " + error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/student/:studentId/xp", requireAuth, validateStudentId, validateXpData)
  async addXp(@request() req: Request, @response() res: Response) {
    try {
      const studentId = parseInt(req.params.studentId, 10);
      const { xp } = req.body;
      const updated = await this.serviceGamification.addXp(studentId, xp);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(updated);
    } catch (error: any) {
      this.logger.error("Error adding xp: " + error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/student/:studentId/badge", requireAuth, validateStudentId, validateBadgeData)
  async awardBadge(@request() req: Request, @response() res: Response) {
    try {
      const studentId = parseInt(req.params.studentId, 10);
      const { badge } = req.body;
      const updated = await this.serviceGamification.awardBadge(studentId, badge);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(updated);
    } catch (error: any) {
      this.logger.error("Error awarding badge: " + error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/student/:studentId/streak", requireAuth, validateStudentId)
  async updateStreak(@request() req: Request, @response() res: Response) {
    try {
      const studentId = parseInt(req.params.studentId, 10);
      const updated = await this.serviceGamification.updateStreak(studentId);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(updated);
    } catch (error: any) {
      this.logger.error("Error updating streak: " + error);
      return this.handleError(error, res);
    }
  }
}
