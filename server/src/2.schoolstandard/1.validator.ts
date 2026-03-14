import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { handleValidationError } from "../common/validation-error";

const schoolstandardSchema = z.object({
  Id: z.number().min(1).max(9999).nullable().optional(),
  school: z.number().min(1).max(9999).nullable().optional(),
  standard: z.number().min(1).max(9999).nullable().optional(),
});

const validateSchoolStandard = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    // Validate request body against schema
    schoolstandardSchema.parse(request.body);
    next();
  } catch (error) {
    // Use the common error handler
    handleValidationError(error, response, next);
  }
};

export { validateSchoolStandard };
