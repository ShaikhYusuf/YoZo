import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { handleValidationError } from "../common/validation-error";

const lessonsectionSchema = z.object({
  Id: z.number().min(1).max(9999).nullable().optional(),
  name: z.string().min(3).max(2048),
  explanation: z.string().min(3).max(102400),
  quiz: z.string().min(3).max(102400),
  fillblanks: z.string().min(3).max(102400),
  truefalse: z.string().min(3).max(102400),
  subject: z.number().min(1).max(9999).nullable().optional(),
  lesson: z.number().min(1).max(9999).nullable().optional(),
});

const validateLessonSection = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    // Validate request body against schema
    lessonsectionSchema.parse(request.body);
    next();
  } catch (error) {
    // Use the common error handler
    handleValidationError(error, response, next);
  }
};

export { validateLessonSection };
