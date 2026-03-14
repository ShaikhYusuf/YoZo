import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "./constant/http-status-code";
import { CONSTANT } from "./constant/constant";
import { ILogger } from "./service/logger.service";
import { ServiceTenant } from "./service/tenant.service";
import TYPES from "../ioc/types";
import { container } from "../ioc/container";
import {
  RequestContext,
  RequestContextProvider,
} from "./service/request-context.service";

export class Validate {
  private logger: ILogger;
  private tenantService: ServiceTenant;

  constructor() {
    this.logger = container.get(TYPES.LoggerService);
    this.tenantService = container.get(ServiceTenant);
  }

  public async headers(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = await this.extractTenantId(req);
      if (!tenantId) {
        return next({
          code: HttpStatusCode.BAD_REQUEST,
          message: CONSTANT.MESSAGE.TENANT_ID_MISSING,
        });
      }

      // Validate tenant existence and token
      const token = this.extractToken(req);
      const [isValidTenant, isValidToken] = await Promise.all([
        this.tenantService.isValidTenant(tenantId),
        this.tenantService.verifyToken(tenantId, token),
      ]);

      if (!isValidTenant || !isValidToken) {
        return next({
          code: HttpStatusCode.FORBIDDEN,
          message: CONSTANT.MESSAGE.ACCESS_DENIED,
        });
      }

      // Setup request context
      await this.setupRequestContext(req, tenantId, next);
    } catch (error) {
      next(error);
    }
  }

  // Extract tenant ID from request headers
  private extractTenantId(req: Request): string | null {
    return (req.headers["tenantid"] as string) ?? null;
  }

  // Extract token from the request headers
  private extractToken(req: Request): string {
    return (req.headers["authorization"]?.replace("bearer ", "") ??
      "") as string;
  }

  // Setup request context with tenant information
  private async setupRequestContext(
    req: Request,
    tenantId: string,
    next: NextFunction
  ): Promise<void> {
    const requestHeaders = {
      tenantid: tenantId,
      traceparent: req.headers["traceparent"] as string,
      authorization: req.headers["authorization"] as string,
    };

    const contextProvider = container.get(RequestContextProvider);
    const context = new RequestContext();
    context.tenantId = tenantId;
    context.traceparent = requestHeaders.traceparent;
    context.databaseConnection = this.tenantService.getConnection(tenantId);

    contextProvider.run(context, () =>  next());
  }
}
