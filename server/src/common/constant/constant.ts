export const CONSTANT = {
  MESSAGE: {
    OK: "OK",
    ERROR: "SOME ERROR OCCURED",
    TENANT_ID_MISSING: "Tenant Id Missing",
    ACCESS_DENIED: "Access Denied",
  },
  SERVICE_STATUS: {
    STARTED: "STARTED",
    READY: "READY",
    STOPPED: "STOPPED",
    NOT_AVAILABLE: "NOT AVAILABLE",
  },
  CONFIG: {
    SERVICE_PORT: 9000,
    HEALTH_CHECK_PORT: 5678,
  },
  SECURITY: {
    STRICT_TRANSPORT_SECURITY: "Strict-Transport-Security",
    MAX_AGE: "max-age=31536000, includeSubDomains",
    CONTENT_TYPE: "Content-Type=application/json",
  },
};

export enum ServiceStatus {
  Ready = "Ready",
  Started = "Started",
  Stopped = "Stopped",
  NotAvailable = "Not Available",
}
