import express from "express";
import { HttpStatusCode } from "./constant/http-status-code";

export class BaseController {
  public handleError(err: Error, res: express.Response) {
    const errorResponse = {
      status: "error",
      code: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: "Internal Server Error",
    };

    if (err instanceof Error) {
      const errorMap: { [key: string]: { code: number; message: string } } = {
        SequelizeUniqueConstraintError: {
          code: HttpStatusCode.CONFLICT_RESOURCE_ALREADY_EXISTS,
          message: "Resource already exists.",
        },
        ValidationError: {
          code: HttpStatusCode.BAD_REQUEST,
          message: "Invalid data provided.",
        },
        NotFoundError: {
          code: HttpStatusCode.NOT_FOUND,
          message: "Resource not found.",
        },
      };

      const mappedError = errorMap[err.name];
      if (mappedError) {
        errorResponse.code = mappedError.code;
        errorResponse.message = mappedError.message;
      } else {
        errorResponse.message = err.message;
      }
    }

    return res.status(errorResponse.code).json(errorResponse);
  }
}
