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

import { IContext, IMessage } from "./0.model";
import { validateContext } from "./1.validator";
import { IServiceChat } from "./3.service.model";

@controller("/chat")
export class ControllerChat extends BaseController {
  private logger: ILogger;
  private serviceChat: IServiceChat;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
    this.serviceChat = container.get(TYPES.ServiceSubject);
  }

  private setCommonHeaders(res: Response) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000, includeSubDomains"
    );
  }

  @httpPost("/", validateContext)
  async create(@request() req: Request, @response() res: Response) {
    try {
      const status = await this.serviceChat.create(req.body);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }
}
