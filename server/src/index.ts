// index.ts
import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config({ path: `${__dirname}/.env` });

import { serverConfig } from "./common/server/0.server-config";
import { Server } from "./common/server/1.server";

if (serverConfig.environment !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const server = new Server();
server.startServer();

process.on("SIGTERM", () => server.stopServer());
process.on("SIGINT", () => server.stopServer());
