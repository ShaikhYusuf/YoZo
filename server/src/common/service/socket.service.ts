import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { injectable } from "inversify";
import { ILogger } from "./logger.service";
import TYPES from "../../ioc/types";
import { container } from "../../ioc/container";

@injectable()
export class SocketService {
  private io!: SocketServer;
  private logger: ILogger;

  constructor() {
    this.logger = container.get(TYPES.LoggerService);
  }

  public init(server: HttpServer): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: "*", // Adjust origins in production if needed
        methods: ["GET", "POST"]
      }
    });

    this.io.on("connection", (socket: Socket) => {
      this.logger.info(`Client connected to WebSocket: ${socket.id}`);

      socket.on("disconnect", () => {
        this.logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    this.logger.info("Socket.io initialized successfully.");
  }

  public emit(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  public emitToUser(userId: string, event: string, data: any): void {
    // In a real app, you'd map userIds to socketIds.
    // For this educational prototype, we broadcast or filter by rooms.
    if (this.io) {
      this.io.to(userId).emit(event, data);
    }
  }
}
