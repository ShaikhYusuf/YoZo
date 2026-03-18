import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { handleValidationError } from "../common/validation-error";

const studentSchema = z.object({
  Id: z.number().min(1).max(9999).nullable().optional(),
  name: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[A-Za-z ]+$/),
  username: z.string().min(3).max(255), // Relaxed constraint
  school: z.number().min(1).max(9999).nullable().optional(),
  standard: z.number().min(1).max(9999).nullable().optional(),
});

const validateStudent = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    // Validate request body against schema
    studentSchema.parse(request.body);
    next();
  } catch (error) {
    // Use the common error handler
    handleValidationError(error, response, next);
  }
};

const validateUsername = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const username = request.params.username; // Extracting username from URL
    const usernameSchema = z.object({
      username: z.string().min(3).max(255), // Relaxed constraint
    });

    usernameSchema.parse({ username });
    next();
  } catch (error) {
    // Use the common error handler
    handleValidationError(error, response, next);
  }
};

export { validateStudent, validateUsername };
