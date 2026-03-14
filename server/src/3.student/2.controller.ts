import { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpGet,
  httpPost,
  httpPatch,
  httpDelete,
  request,
  response,
  httpPut,
} from "inversify-express-utils";

import { ILogger, LoggerService } from "../common/service/logger.service";
import TYPES from "../ioc/types";
import { container } from "../ioc/container";

import { BaseController } from "../common/base-controller";
import { HttpStatusCode } from "../common/constant/http-status-code";
import { validateId } from "../common/validator-id";

import { IStudent } from "./0.model";
import { validateAdhaar, validateStudent } from "./1.validator";
import { IServiceStudent } from "./3.service.model";
import { ServiceStudentProgressImpl } from "./3.service.student.progress";

@controller("/student")
export class ControllerStudent extends BaseController {
  private logger: ILogger;
  private serviceStudent: IServiceStudent;
  private serviceStudentProgressImpl: ServiceStudentProgressImpl;

  constructor() {
    super();
    this.logger = container.get(TYPES.LoggerService);
    this.serviceStudent = container.get(TYPES.ServiceStudent);
    this.serviceStudentProgressImpl = new ServiceStudentProgressImpl();
  }

  private setCommonHeaders(res: Response) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000, includeSubDomains"
    );
  }

  @httpGet("/school/:schoolId/standard/:standardId")
  async getAll(@request() req: Request, @response() res: Response) {
    try {
      const schoolId = +req.params.schoolId;
      const standardId = +req.params.standardId;
      const studentList = await this.serviceStudent.getAll(
        schoolId,
        standardId
      );
      this.logger.info("Retrieved studentList:" + studentList?.length);

      this.setCommonHeaders(res);
      if (!studentList) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "studentList not found" });
      }

      res.status(HttpStatusCode.OK).json(studentList);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/adhaar/:adhaar", validateAdhaar)
  async getByAdhaar(@request() req: Request, @response() res: Response) {
    try {
      const adhaar = req.params.adhaar;
      const student = await this.serviceStudent.getByAdhaar(adhaar);
      this.logger.info("Retrieved student:" + student);

      this.setCommonHeaders(res);
      if (!student) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Student not found" });
      }

      res.status(HttpStatusCode.OK).json(student);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpGet("/:id", validateId)
  async get(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const student = await this.serviceStudent.get(id);
      this.logger.info("Retrieved student:" + student);

      this.setCommonHeaders(res);
      if (!student) {
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Student not found" });
      }

      res.status(HttpStatusCode.OK).json(student);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPost("/", validateStudent)
  async create(@request() req: Request, @response() res: Response) {
    try {
      const student = req.body as IStudent;
      const studentObj = await this.serviceStudent.create(student);
      if (studentObj) {
        await this.serviceStudentProgressImpl.create(studentObj);
      }
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(studentObj);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpPut("/:id", validateId, validateStudent)
  async update(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      const status = await this.serviceStudent.update(id, req.body);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }

  @httpDelete("/:id", validateId)
  async delete(@request() req: Request, @response() res: Response) {
    try {
      const id = +req.params.id;
      await this.serviceStudentProgressImpl.delete(id);
      const status = await this.serviceStudent.delete(id);
      this.setCommonHeaders(res);
      res.status(HttpStatusCode.OK).json(status);
    } catch (error: any) {
      this.logger.error(error);
      return this.handleError(error, res);
    }
  }
}
