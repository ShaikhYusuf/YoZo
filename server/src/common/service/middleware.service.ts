import { Request, Response, NextFunction } from "express";
import { inject } from "inversify";
import TYPES from "../../ioc/types";
import { container } from "../../ioc/container";

import { ILogger } from "./logger.service";
import { CONSTANT } from "../constant/constant";

import { ServiceTenant } from "./tenant.service";
import { HttpStatusCode } from "../constant/http-status-code";
import { RequestContextProvider } from "./request-context.service";
import { RequestContext } from "./request-context.service";
import { Validate } from "../validate";

export class MiddlewareProvider {
  private logger: ILogger;
  private tenantService: ServiceTenant;
  private validate: Validate;

  constructor(
    @inject(TYPES.LoggerService) logger: ILogger,
    @inject(ServiceTenant) tenantService: ServiceTenant,
    @inject(Validate) validate: Validate
  ) {
    this.logger = logger;
    this.tenantService = tenantService;
    this.validate = validate;

    this.middlewareValidateTenant = this.middlewareValidateTenant.bind(this);
  }

  // Middleware to handle exception and modify response body
  public middlewareException(req: Request, res: Response, next: NextFunction) {
    res.setHeader(
      CONSTANT.SECURITY.STRICT_TRANSPORT_SECURITY,
      CONSTANT.SECURITY.MAX_AGE
    );

    const originalSend = res.send;
    res.send = function (data) {
      try {
        if (res?.statusCode && data) {
          const resBody = JSON.parse(data);
          if (resBody?.Error) {
            data = { code: res.statusCode, error: resBody.Error };
          }
        }
      } catch (err: any) {
        console.warn(`Error parsing response body: ${err.message}`);
      }
      return originalSend.call(this, data);
    };
    next();
  }

  // Main middleware to validate tenant information
  public async middlewareValidateTenant(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      this.validate.headers(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}
