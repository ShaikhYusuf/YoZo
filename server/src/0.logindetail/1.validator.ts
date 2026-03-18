import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { handleValidationError } from "../common/validation-error";
import { roleList } from "./0.model";

const logindetailSchema = z.object({
  Id: z.number().min(1).max(9999).nullable().optional(),
  name: z
    .string()
    .min(3)
    .max(255),
  username: z.string().min(3).max(50),
  password: z
    .string()
    .min(5)
    .max(128),
  role: z.enum(roleList),
});

const validateLoginDetail = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    // Validate request body against schema
    logindetailSchema.parse(request.body);
    next();
  } catch (error) {
    // Use the common error handler
    handleValidationError(error, response, next);
  }
};

const loginDataSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(255),
  password: z
    .string()
    .min(5)
    .max(128),
});

const validateLoginData = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    // Validate request body against schema
    loginDataSchema.parse(request.body);
    next();
  } catch (error) {
    // Use the common error handler
    handleValidationError(error, response, next);
  }
};
export { validateLoginDetail, validateLoginData };
