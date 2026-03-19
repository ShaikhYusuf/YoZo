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
import { SocketService } from "../common/service/socket.service";

import { BaseController } from "../common/base-controller";
import { HttpStatusCode } from "../common/constant/http-status-code";
import { getEnvVariable } from "../common/utility/env-utils";
import { aiLimiter } from "../common/middleware/rate-limiter";
import { requireAuth } from "../common/middleware/auth-guard";

const AI_SERVICE_URL = getEnvVariable("AI_SERVICE_URL", "http://localhost:5000");

@controller("/ai")
export class ControllerAi extends BaseController {
  private logger: ILogger;
  private socketService: SocketService;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
    this.socketService = container.get(SocketService);
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
      
      // If the AI service returned a task_id (Status 202 Accepted), start polling in background
      if (response.status === 202 && data.data && data.data.task_id) {
        const trackedPath = searchParams.toString() ? `${targetPath}?${searchParams.toString()}` : targetPath;
        this.startPoller(data.data.task_id, trackedPath);
      }

      this.setCommonHeaders(res);
      res.status(response.status).json(data);
    } catch (error: any) {
      this.logger.error(`Error proxying to AI Service: ${error.message}`);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Failed to connect to AI Service." });
    }
  }

  private startPoller(taskId: string, originalPath: string) {
    this.logger.info(`Starting background poller for task: ${taskId}`);
    
    const poll = async () => {
      try {
        const url = `${AI_SERVICE_URL}/api/ai/tasks/${taskId}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "success") {
          const task = data.data;
          if (task.status === "completed") {
            this.logger.info(`Task ${taskId} completed successfully.`);
            this.socketService.emit("ai_task_update", {
              taskId,
              status: "completed",
              path: originalPath,
              result: task.result
            });
            return; // Stop polling
          } else if (task.status === "failed") {
            this.logger.error(`Task ${taskId} failed: ${task.error}`);
            this.socketService.emit("ai_task_update", {
              taskId,
              status: "failed",
              path: originalPath,
              error: task.error
            });
            return; // Stop polling
          }
        } else {
          // Handle API errors (like 404 Task Not Found)
          this.logger.error(`AI Service reported error for task ${taskId}: ${data.message || 'Unknown error'}`);
          this.socketService.emit("ai_task_update", {
            taskId,
            status: "failed",
            path: originalPath,
            error: data.message || "Quality Check: AI Task lost or failed."
          });
          return; // Stop polling
        }
        
        // If still pending/running, poll again in 2 seconds
        setTimeout(poll, 2000);
      } catch (error: any) {
        this.logger.error(`Polling error for task ${taskId}: ${error.message}`);
        this.socketService.emit("ai_task_update", {
          taskId,
          status: "failed",
          path: originalPath,
          error: "Lost connection to AI Service during generation."
        });
      }
    };

    poll();
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

  @httpGet("/fillblank", aiLimiter, requireAuth)
  async getFillBlank(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/fillblank");
  }

  @httpGet("/shortquestions", aiLimiter, requireAuth)
  async getShortQuestions(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/shortquestions");
  }

  @httpPost("/compare", aiLimiter, requireAuth)
  async compare(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/compare", "POST", req.body);
  }

  @httpPost("/chat", aiLimiter, requireAuth)
  async chat(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/chat", "POST", req.body);
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

  // ─────────────────── Lesson Notes ───────────────────

  @httpGet("/notes", aiLimiter, requireAuth)
  async getNotes(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/notes");
  }

  @httpGet("/notes/pdf", aiLimiter, requireAuth)
  async getNotesPdf(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/notes/pdf");
  }

  @httpPost("/notes/publish", aiLimiter, requireAuth)
  async publishNotes(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/notes/publish", "POST", req.body);
  }

  @httpPost("/notes/regenerate", aiLimiter, requireAuth)
  async regenerateNotes(@request() req: Request, @response() res: Response) {
    await this.proxyRequest(req, res, "/notes/regenerate", "POST", req.body);
  }
}
