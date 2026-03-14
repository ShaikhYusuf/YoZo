import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "../common/constant/http-status-code";

export const validateStudentId = (req: Request, res: Response, next: NextFunction) => {
  const studentId = parseInt(req.params.studentId, 10);
  if (isNaN(studentId)) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({ message: "Invalid studentId" });
  }
  next();
};

export const validateXpData = (req: Request, res: Response, next: NextFunction) => {
  const { xp } = req.body;
  if (typeof xp !== 'number' || xp <= 0) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({ message: "Invalid XP amount" });
  }
  next();
};

export const validateBadgeData = (req: Request, res: Response, next: NextFunction) => {
  const { badge } = req.body;
  if (!badge || typeof badge !== 'string') {
    return res.status(HttpStatusCode.BAD_REQUEST).json({ message: "Invalid badge name" });
  }
  next();
};
