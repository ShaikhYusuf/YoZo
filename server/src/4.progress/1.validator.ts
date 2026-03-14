import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { handleValidationError } from "../common/validation-error";

const progressSchema = z.object({
  Id: z.number().min(1).max(9999).nullable().optional(),
  quiz: z.number().max(100),
  fillblanks: z.number().max(100),
  truefalse: z.number().max(100),
  school: z.number().min(1).max(9999).nullable().optional(),
  standard: z.number().min(1).max(9999).nullable().optional(),
  student: z.number().min(1).max(9999).nullable().optional(),
});

const validateProgress = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    // Validate request body against schema
    progressSchema.parse(request.body);
    next();
  } catch (error) {
    // Use the common error handler
    handleValidationError(error, response, next);
  }
};

export { validateProgress };
