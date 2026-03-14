import winston from "winston";
import { injectable } from "inversify";
import { serverConfig } from "../server/0.server-config";

export interface ILogger {
  info(message: any): void;
  warn(message: any): void;
  error(message: any): void;
}


@injectable()
export class LoggerService implements ILogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = this.initializeLogger();
  }

  private initializeLogger() {
    const formatCustomTimestamp = () => {
      const now = new Date();
      const pad = (num: number) => num.toString().padStart(2, "0");
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
        now.getSeconds()
      )}`;
    };

    return winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp({ format: formatCustomTimestamp }),
        winston.format.printf(
          (info) => `${info.timestamp}: ${info.level} => ${info.message}`
        ),
        winston.format.colorize({ all: true })
      ),
      transports: [
        new winston.transports.Console({
          level: serverConfig.log.level,
        }),
      ],
    });
  }

  info(message: any) {
    this.logger.info(message);
  }

  warn(message: any) {
    this.logger.warn(message);
  }

  error(message: any) {
    this.logger.error(message);
  }
}