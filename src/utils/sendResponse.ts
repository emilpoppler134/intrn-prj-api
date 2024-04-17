import { Response } from "express";
import { ErrorCode, SuccessCode } from "../types/StatusCode.js";

export class ErrorResponse {
  status: ErrorCode;
  message: string;

  constructor(status: ErrorCode, message: string) {
    this.status = status;
    this.message = message;
  }
}

export const sendValidResponse = <T>(
  res: Response,
  status: SuccessCode = SuccessCode.NO_CONTENT,
  data?: T,
) => {
  res.status(status);

  if (data !== undefined && status !== SuccessCode.NO_CONTENT) {
    res.setHeader("Content-Type", "application/json");
    res.json(data);
  }

  res.end();
};
