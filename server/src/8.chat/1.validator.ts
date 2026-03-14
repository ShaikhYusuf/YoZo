import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { handleValidationError } from "../common/validation-error";

const messageSchema = z.object({
  content: z.string().min(1), // Ensures message is a non-empty string
  isUser: z.boolean(), // Ensures it is a boolean value
});

const contextSchema = z.object({
  Id: z.number().min(1).max(9999).nullable().optional(),
  explanation: z.string().optional(), // Allows an optional string
  messages: z.array(messageSchema), // Ensures an array of messages
});

const validateContext = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    // Validate request body against schema
    contextSchema.parse(request.body);
    next();
  } catch (error) {
    // Use the common error handler
    handleValidationError(error, response, next);
  }
};

export { validateContext };
