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
      if (res?.statusCode && data) {
        try {
          // Only attempt to parse if it's a string
          if (typeof data === "string") {
            const resBody = JSON.parse(data);
            if (resBody?.Error) {
              data = JSON.stringify({
                code: res.statusCode,
                error: resBody.Error,
              });
            }
          } else if (typeof data === "object" && data !== null) {
            // If it's already an object, just wrap it if it has an Error property
            if ((data as any).Error) {
              data = { code: res.statusCode, error: (data as any).Error };
            }
          }
        } catch (err: any) {
          // Silently ignore parsing errors for non-JSON content
        }
      }
      return originalSend.call(this, data);
    };
    next();
  }

  // Global Error Handler to catch objects passed to next()
  public globalErrorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (res.headersSent) {
      return next(err);
    }

    const status = err.code || HttpStatusCode.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";

    res.status(status).json({
      status: "error",
      code: status,
      message: message,
    });
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
