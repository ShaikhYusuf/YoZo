import { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpGet,
  httpPost,
  request,
  response,
} from "inversify-express-utils";

import { ILogger } from "../common/service/logger.service";
import TYPES from "../ioc/types";
import { container } from "../ioc/container";

import { BaseController } from "../common/base-controller";
import { HttpStatusCode } from "../common/constant/http-status-code";
import { getEnvVariable } from "../common/utility/env-utils";
import { aiLimiter } from "../common/middleware/rate-limiter";
import { requireAuth } from "../common/middleware/auth-guard";

const AI_SERVICE_URL = getEnvVariable("AI_SERVICE_URL", "http://localhost:5000");

@controller("/ai")
export class ControllerAi extends BaseController {
  private logger: ILogger;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
  }

  private setCommonHeaders(res: Response) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000, includeSubDomains"
    );
  }

  private async proxyRequest(req: Request, res: Response, targetPath: string, method: string = "GET", body?: any) {
    try {
      const url = `${AI_SERVICE_URL}/api/ai${targetPath}`;
      const searchParams = new URLSearchParams(req.query as Record<string, string>);
      const fullUrl = searchParams.toString() ? `${url}?${searchParams.toString()}` : url;

      this.logger.info(`Proxying ${method} request to AI Service: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      this.setCommonHeaders(res);
      res.status(response.status).json(data);
    } catch (error: any) {
      this.logger.error(`Error proxying to AI Service: ${error.message}`);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to connect to AI Service." });
    }
  }

  @httpGet("/content", aiLimiter, requireAuth)
  async getContent(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/content");
  }

  @httpGet("/quiz", aiLimiter, requireAuth)
  async getQuiz(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/quiz");
  }

  @httpGet("/truefalse", aiLimiter, requireAuth)
  async getTrueFalse(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/truefalse");
  }

  @httpGet("/shortquestions", aiLimiter, requireAuth)
  async getShortQuestions(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/shortquestions");
  }

  @httpPost("/compare", aiLimiter, requireAuth)
  async compare(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/compare", "POST", req.body);
  }

  @httpGet("/hierarchy", aiLimiter, requireAuth)
  async getHierarchy(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/hierarchy");
  }

  @httpPost("/scores", aiLimiter, requireAuth)
  async updateScores(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/scores", "POST", req.body);
  }

  @httpGet("/scores/all", aiLimiter, requireAuth)
  async getAllScores(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/scores/all");
  }
}
