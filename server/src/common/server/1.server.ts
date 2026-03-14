// server.ts
import { inject } from "inversify";
import dotenv from "dotenv";
dotenv.config({ path: `${__dirname}/../.env` });
import TYPES from "../../ioc/types";
import { container } from "../../ioc/container";

import { Application } from "express";
import http, { Server as HttpServer } from "http";
import { App } from "./app";
import { ILogger, LoggerService } from "../service/logger.service";
import { serverConfig } from "./0.server-config";
import { ServerHealth } from "./2.server-health";
import { ServiceTenant } from "../service/tenant.service";

export class Server {
  private logger: ILogger;
  private tenantService: ServiceTenant;

  private app: Application;
  private server!: HttpServer;
  private healthServer!: ServerHealth;
  private isServerRunning = false;

  constructor() {
    this.logger = container.get(TYPES.LoggerService);
    this.tenantService = container.get(ServiceTenant);

    this.app = new App().init();
    this.server = http.createServer(this.app);
    this.healthServer = new ServerHealth(this.logger);
  }

  async startServer(): Promise<void> {
    try {
      this.tenantService.storeTenantConfiguration(serverConfig.tenantList);
      await this.tenantService.connect();

      this.server.listen(serverConfig.port, async () => {
        this.logger.info(`Server Started at port ${serverConfig.port}`);
        try {
          await this.healthServer.start(Number(serverConfig.healthPort));
          this.isServerRunning = true;
        } catch (err) {
          this.logger.error("Failed to start the Health Server: " + err);
          await this.stopServer();
        }
      });
    } catch (err) {
      this.logger.error("Failed to start the server: " + err);
    }
  }

  async stopServer(): Promise<void> {
    if (!this.isServerRunning) {
      this.logger.warn("Server is not running, skipping stop sequence.");
      return;
    }

    try {
      this.server.close(async (err) => {
        if (err) {
          this.logger.error("Error while closing the server: " + err);
        }

        await this.tenantService.disconnect();
        await this.healthServer.stop();
        this.logger.info(`Server Closed at port ${serverConfig.port}`);
        this.isServerRunning = false;
      });
    } catch (err) {
      this.logger.error("Error during server shutdown: " + err);
    }
  }
}
