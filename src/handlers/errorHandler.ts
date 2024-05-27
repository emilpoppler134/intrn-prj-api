import { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "../utils/sendResponse.js";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(error);
  if (error instanceof ErrorResponse) {
    return res.status(error.status).send({ message: error.message });
  }

  // Unhandled errors
  console.error(JSON.stringify(error, null, 2));
  return res.status(500).send({ message: "Something went wrong" });
};
