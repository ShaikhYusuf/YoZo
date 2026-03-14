import { ITenant } from "../service/tenant.service";
import { getEnvVariable, validateEnvVariables } from "../utility/env-utils";

const DEFAULT_OPTIONS = {
  dialect: "postgres", // Switched from MySQL to PostgreSQL for YoZo
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

const serverConfig = {
  serviceName: "student-service",
  environment: process.env.NODE_ENV || "development",
  port: getEnvVariable("PORT", "3000"),
  healthPort: getEnvVariable("HEALTH_PORT", "3001"),
  limit: getEnvVariable("REQUEST_PAYLOAD_LIMIT", "10mb"),

  corsOption: {
    origin: function (origin: any, callback: any) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:4200",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4200",
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "tenantid",
      "traceparent",
    ],
    exposedHeaders: [
      "Content-Type",
      "Authorization",
      "tenantid",
      "traceparent",
    ],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        //"upgrade-insecure-requests": [], ==> Enforce TLS
      },
    },
  },

  log: {
    level: getEnvVariable("LOG_LEVEL", "debug"),
    timeFormat: getEnvVariable("TIMESTAMP_FORMAT", "yyyy-mm-dd"),
  },

  STRICT_TRANSPORT_SECURITY: "Strict-Transport-Security",
  MAX_AGE: "max-age=31536000; includeSubDomains",
  CONTENT_TYPE: "Content-Type=application/json",
  CLIENT_PATH: "dashboard",

  tenantList: readTenantConfiguration(),
};

function readTenantConfiguration(): ITenant[] {
  const tenantCount = parseInt(getEnvVariable("TENANT_COUNT", "1"), 10);
  const tenants: ITenant[] = [];

  for (let i = 1; i <= tenantCount; i++) {
    const tenantEnvPrefix = `TENANT_${i}`;
    validateEnvVariables([
      `${tenantEnvPrefix}_ID`,
      `${tenantEnvPrefix}_AUTH_SERVER`,
      `${tenantEnvPrefix}_CLIENT_ID`,
      `${tenantEnvPrefix}_CLIENT_SECRET`,
      `${tenantEnvPrefix}_DB_URI`,
      `${tenantEnvPrefix}_DB_USERNAME`,
      `${tenantEnvPrefix}_DB_PASSWORD`,
    ]);

    tenants.push({
      id: getEnvVariable(`${tenantEnvPrefix}_ID`, ""),
      authentication: {
        authServer: getEnvVariable(`${tenantEnvPrefix}_AUTH_SERVER`, ""),
        clientId: getEnvVariable(`${tenantEnvPrefix}_CLIENT_ID`, ""),
        clientSecret: getEnvVariable(`${tenantEnvPrefix}_CLIENT_SECRET`, ""),
      },
      database: {
        sqlDBName: getEnvVariable(`${tenantEnvPrefix}_NAME`, ""),
        connectionUri: getEnvVariable(`${tenantEnvPrefix}_DB_URI`, ""),
        username: getEnvVariable(`${tenantEnvPrefix}_DB_USERNAME`, ""),
        password: getEnvVariable(`${tenantEnvPrefix}_DB_PASSWORD`, ""),
        options: {
          dialect: getEnvVariable(
            `${tenantEnvPrefix}_DB_DIALECT`,
            DEFAULT_OPTIONS.dialect
          ),
          pool: {
            max: parseInt(
              getEnvVariable(
                `${tenantEnvPrefix}_DB_POOL_MAX`,
                DEFAULT_OPTIONS.pool.max.toString()
              ),
              10
            ),
            min: parseInt(
              getEnvVariable(
                `${tenantEnvPrefix}_DB_POOL_MIN`,
                DEFAULT_OPTIONS.pool.min.toString()
              ),
              10
            ),
            acquire: parseInt(
              getEnvVariable(
                `${tenantEnvPrefix}_DB_POOL_ACQUIRE`,
                DEFAULT_OPTIONS.pool.acquire.toString()
              ),
              10
            ),
            idle: parseInt(
              getEnvVariable(
                `${tenantEnvPrefix}_DB_POOL_IDLE`,
                DEFAULT_OPTIONS.pool.idle.toString()
              ),
              10
            ),
          },
        },
        connection: null,
      },
    });
  }

  return tenants;
}

export { serverConfig };
