import { ReplicateStream } from "ai";
import { Request, Response } from "express";
import { DeleteResult, UpdateResult } from "mongodb";
import { Types } from "mongoose";
import Replicate from "replicate";
import { REPLICATE_API_TOKEN } from "../config.js";
import { Bot, IBot } from "../models/Bot.js";
import { IModel, Model } from "../models/Model.js";
import { NumberParam, ParamValue } from "../types/ParamValue.js";
import { ErrorCode, SuccessCode } from "../types/StatusCode.js";
import { TokenPayload } from "../types/TokenPayload.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

type BotExtended = Omit<IBot, "model"> & { model: IModel };
type FindBotResponse = { models: Array<IModel>; bot: BotResponse };

type BotResponse = {
  id: string;
  name: string;
  photo: string;
  system_prompt: string;
  model: IModel;
  maxTokens: number;
  temp: number;
  topP: number;
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
  const findBot: BotExtended | null = await Bot.findOne({
    user: user._id,
    _id: id,
  }).populate({ path: "model", model: "Model" });

  // If no result, return error
  if (findBot === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "There is no bot with that Id.",
    );
  }

  const listModels: Array<IModel> | null = await Model.find();

  if (listModels === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when fetching the models.",
    );
  }

  const botResponse: FindBotResponse = {
    bot: {
      id: findBot._id.toString(),
      name: findBot.name,
      photo: findBot.photo,
      system_prompt: findBot.system_prompt,
      model: findBot.model,
      maxTokens: findBot.maxTokens,
      temp: findBot.temperature,
      topP: findBot.topP,
      timestamp: Math.floor(new Date(findBot.timestamp).getTime() / 1000),
    },
    models: listModels,
  };

  return sendValidResponse<FindBotResponse>(res, SuccessCode.OK, botResponse);
}

async function list(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  // Look for the bot in the database by userId
  const listBots: Array<BotExtended> | null = await Bot.find({
    user: user._id,
  }).populate({ path: "model", model: "Model" });
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
    photo: item.photo,
    system_prompt: item.system_prompt,
    model: item.model,
    maxTokens: item.maxTokens,
    temp: item.temperature,
    topP: item.topP,
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
    system_prompt: `You are a helpful assistant called ${name}.`,
  });
  // If something went wrong, return an error
  if (createBot === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when creating the bot.",
    );
  }

  const findExtendedBot: BotExtended | null = await Bot.findOne({
    user: user._id,
    _id: createBot._id,
  }).populate({ path: "model", model: "Model" });

  if (findExtendedBot === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when creating the bot.",
    );
  }

  const botResponse: BotResponse = {
    id: findExtendedBot._id.toString(),
    name: findExtendedBot.name,
    photo: findExtendedBot.photo,
    system_prompt: findExtendedBot.system_prompt,
    model: findExtendedBot.model,
    maxTokens: findExtendedBot.maxTokens,
    temp: findExtendedBot.temperature,
    topP: findExtendedBot.topP,
    timestamp: Math.floor(new Date(findExtendedBot.timestamp).getTime() / 1000),
  };

  // If all good, return the bot Id.
  return sendValidResponse<BotResponse>(res, SuccessCode.CREATED, botResponse);
}

async function update(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;

  const name: ParamValue = req.body.name;
  const system_prompt: ParamValue = req.body.system_prompt;
  const model: ParamValue = req.body.model;
  const maxTokens: NumberParam = req.body.maxTokens;
  const temperature: NumberParam = req.body.temp;
  const topP: NumberParam = req.body.topP;

  if (
    !Types.ObjectId.isValid(id) ||
    name === undefined ||
    system_prompt === undefined ||
    model === undefined ||
    maxTokens === undefined ||
    temperature === undefined ||
    topP === undefined
  ) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  const updateUser: UpdateResult = await Bot.updateOne(
    { user: user._id, _id: id },
    { name, system_prompt, model, maxTokens, temperature, topP },
  );

  if (updateUser.acknowledged === false) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when updating the bot.",
    );
  }

  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

async function remove(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;

  // Check if all required values is defined
  if (!Types.ObjectId.isValid(id)) {
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
  const deleteBot: DeleteResult = await Bot.deleteOne({
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

async function chat(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;
  const prompt: ParamValue = req.body.prompt;

  // Check if all required values is defined
  if (prompt === undefined || !Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Look for the bot in the database by Id and userId
  const findBot: BotExtended | null = await Bot.findOne({
    user: user._id,
    _id: id,
  }).populate({ path: "model", model: "Model" });

  // If no result, return error
  if (findBot === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "There is no bot with that Id.",
    );
  }

  const llamaResponse = await replicate.predictions.create({
    model: findBot.model.name,
    stream: true,
    input: {
      prompt: `${prompt}`,
      max_new_tokens: findBot.maxTokens,
      ...(findBot.model.name.includes("llama3")
        ? { max_tokens: findBot.maxTokens }
        : { max_new_tokens: findBot.maxTokens }),
      temperature: findBot.temperature,
      repetition_penalty: 1,
      top_p: findBot.topP,
    },
  });

  const stream = await ReplicateStream(llamaResponse);

  const writableStream = new WritableStream({
    write(chunk) {
      res.write(chunk);
    },
  });

  stream.pipeTo(writableStream);
}

export default { find, list, create, update, remove, chat };
