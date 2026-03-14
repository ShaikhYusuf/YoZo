import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpStatusCode } from "../common/constant/http-status-code";

// Common function to handle Zod errors
export const handleValidationError = (
  error: unknown,
  response: Response,
  next: NextFunction
): void => {
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    response.status(HttpStatusCode.BAD_REQUEST).json({
      status: "error",
      code: HttpStatusCode.BAD_REQUEST,
      errors: formattedErrors,
    });
  } else {
    next(error);
  }
};
