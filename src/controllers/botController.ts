import { Request, Response } from "express";
import { Types } from "mongoose";
import { Bot } from "../models/Bot.js";
import { ParamValue } from "../types/ParamValue.js";
import { ErrorCode, SuccessCode } from "../types/StatusCode.js";
import { TokenPayload } from "../types/TokenPayload.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

type BotResponse = {
  id: string;
  name: string;
  personality: string;
  photo: string;
  files: Array<string>;
  timestamp: number;
};

async function find(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined || !Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Look for the bot in the database by Id and userId
  const findBot = await Bot.findOne({
    user: user._id,
    _id: id,
  });
  // If no result, return error
  if (findBot === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "There is no bot with that Id.",
    );
  }

  const botResponse: BotResponse = {
    id: findBot._id.toString(),
    name: findBot.name,
    personality: findBot.personality,
    photo: findBot.photo,
    files: findBot.files,
    timestamp: Math.floor(new Date(findBot.timestamp).getTime() / 1000),
  };

  return sendValidResponse<BotResponse>(res, SuccessCode.OK, botResponse);
}

async function list(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  // Look for the bot in the database by userId
  const listBots = await Bot.find({
    user: user._id,
  });
  // If db error, return error
  if (listBots === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when fetching the bots.",
    );
  }

  const botResponse: Array<BotResponse> = listBots.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    personality: item.personality,
    photo: item.photo,
    files: item.files,
    timestamp: Math.floor(new Date(item.timestamp).getTime() / 1000),
  }));

  return sendValidResponse<Array<BotResponse>>(
    res,
    SuccessCode.OK,
    botResponse,
  );
}

async function create(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const name: ParamValue = req.body.name;

  // Check if all required values is defined
  if (name === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Look if the name is available
  const findBot = await Bot.findOne({
    user: user._id,
    name: { $regex: new RegExp("^" + name.toLowerCase(), "i") },
  });
  // If bot with that name already exists, return error
  if (findBot !== null) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "You already have a bot with that name.",
    );
  }

  // Create a new bot in the database
  const createBot = await Bot.create({
    user: user._id,
    name,
  });
  // If something went wrong, return an error
  if (createBot === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when creating the bot.",
    );
  }

  const botResponse: BotResponse = {
    id: createBot._id.toString(),
    name: createBot.name,
    personality: createBot.personality,
    photo: createBot.photo,
    files: createBot.files,
    timestamp: Math.floor(new Date(createBot.timestamp).getTime() / 1000),
  };

  // If all good, return the bot Id.
  return sendValidResponse<BotResponse>(res, SuccessCode.CREATED, botResponse);
}

async function remove(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined || !Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Look for the bot in the database by Id and userId
  const findBot = await Bot.findOne({
    user: user._id,
    _id: id,
  });
  // If no result, return error
  if (findBot === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "There is no bot with that Id.",
    );
  }

  // Delete the bot from the database by id and userId
  const deleteBot = await Bot.deleteOne({
    user: user._id,
    _id: id,
  });
  // If something went wrong, return an error
  if (deleteBot.acknowledged === false) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when deleting the bot.",
    );
  }

  // If all good, return OK
  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

export default { find, list, create, remove };
