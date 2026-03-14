import { createTerminus, TerminusOptions } from "@godaddy/terminus";
import express from "express";
import http, { Server } from "http";
import { ServiceStatus } from "../constant/constant";
import { ILogger } from "../service/logger.service";

export class ServerHealth {
  private server!: Server;
  private status: ServiceStatus = ServiceStatus.Ready;

  constructor(private logger: ILogger) {}

  public async start(port: number): Promise<Server> {
    const options: TerminusOptions = {
      logger: console.error,
      healthChecks: {
        "/health/startup": () => this.isStatus(ServiceStatus.Started, true),
        "/health/readiness": () => this.isStatus(ServiceStatus.Ready, true),
        "/health/liveliness": () =>
          this.isStatus(ServiceStatus.NotAvailable, false),
      },
    };

    const app = express();
    this.server = http.createServer(app);

    return new Promise((resolve, reject) => {
      createTerminus(this.server, options);
      this.server
        .listen(port, () => {
          this.logger.info("Health Server Started");
          this.status = ServiceStatus.Started;
          resolve(this.server);
        })
        .on("error", (err: any) => {
          this.logger.error("FAILED: Health Server Start:" + err);
          reject(err);
        });
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server.close((err: any) => {
          if (err) {
            this.logger.error("Error closing server: " + err);
            return reject(err);
          }
          this.status = ServiceStatus.Stopped;
          this.logger.info("Server Closed");
          resolve();
        });
      });
    }
    return Promise.resolve();
  }

  private async isStatus(
    expectedStatus: ServiceStatus,
    shouldMatch: boolean
  ): Promise<void> {
    if (
      (shouldMatch && this.status === expectedStatus) ||
      (!shouldMatch && this.status !== expectedStatus)
    ) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(`Error in service: Status => ${expectedStatus}`)
    );
  }
}
