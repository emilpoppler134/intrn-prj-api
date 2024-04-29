import { Request, Response } from "express";
import { IModel, Model } from "../models/Model.js";
import { ErrorCode, SuccessCode } from "../types/StatusCode.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

async function list(req: Request, res: Response) {
  const listModels = await Model.find();

  if (listModels === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when fetching the models.",
    );
  }

  // Return Models
  return sendValidResponse<Array<IModel>>(res, SuccessCode.OK, listModels);
}

export default { list };
