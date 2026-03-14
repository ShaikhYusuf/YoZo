import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnvVariable } from "../utility/env-utils";

const JWT_SECRET = getEnvVariable("JWT_SECRET", "change-this-secret-key-in-production");
const AUTH_REQUIRED = getEnvVariable("AUTH_REQUIRED", "false").toLowerCase() === "true";

export interface JwtPayload {
  userId: number;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(userId: number, name: string, role: string): string {
  const expiryHours = parseInt(getEnvVariable("JWT_EXPIRY_HOURS", "24"), 10);
  return jwt.sign(
    { userId, name, role },
    JWT_SECRET,
    { expiresIn: `${expiryHours}h` }
  );
}

/**
 * Middleware: Require valid JWT token in Authorization header.
 * Skipped if AUTH_REQUIRED is false (development mode).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!AUTH_REQUIRED) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Token expired" });
    } else {
      res.status(401).json({ message: "Invalid token" });
    }
  }
}

/**
 * Middleware: Require admin role.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!AUTH_REQUIRED) {
    next();
    return;
  }

  // First validate the JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;

    if (decoded.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    next();
  } catch (error: any) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Middleware: Require specific role(s).
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!AUTH_REQUIRED) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Missing or invalid Authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded;

      if (!roles.includes(decoded.role)) {
        res.status(403).json({ message: `Access restricted to: ${roles.join(", ")}` });
        return;
      }

      next();
    } catch (error: any) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}
