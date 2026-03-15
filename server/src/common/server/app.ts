import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import dotenv from "dotenv";

import { serverConfig } from "./0.server-config";
import { container } from "../../ioc/container";
import TYPES from "../../ioc/types";

import { MiddlewareProvider } from "../service/middleware.service";
import { InversifyExpressServer } from "inversify-express-utils";
import { ILogger } from "../service/logger.service";
import { ServiceTenant } from "../service/tenant.service";
import { generalLimiter } from "../middleware/rate-limiter";

export class App {
  private middlewareService: MiddlewareProvider;
  private logger: ILogger;

  constructor() {
    this.logger = container.get(TYPES.LoggerService);
    this.middlewareService = container.get(MiddlewareProvider);
  }

  public init(): Application {
    const app: Application = express();
    const server = new InversifyExpressServer(container, null, {
      rootPath: "/v1",
    });

    server.setConfig((app: Application) => {
      app.use(compression());
      app.use(express.json({ limit: serverConfig.limit }));
      app.use(express.urlencoded({ extended: true }));
      app.use(express.static(path.join(__dirname, serverConfig.CLIENT_PATH)));

      this.initSecurity(app);

      // Rate limiting
      app.use("/v1", generalLimiter);
    });

    server.setErrorConfig((app: Application) => {
      app.use(this.middlewareService.middlewareException);
    });

    return server.build();
  }

  private initSecurity(app: Application): void {
    app.use(cors(serverConfig.corsOption));
    app.use(helmet());
    app.use(this.middlewareService.middlewareValidateTenant);
  }
}

