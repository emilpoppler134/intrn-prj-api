import { Request, Response } from "express";
import { Types } from "mongoose";

import { Bot } from '../models/Bot.js';
import { ErrorResponse, ValidResponse } from "../lib/response.js";
import { TokenPayload } from "../types/TokenPayload.js";
import { ErrorType } from "../types/Error.js";
import { ParamValue } from "../types/ParamValue.js";

async function find(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined || !Types.ObjectId.isValid(id)) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look for the bot in the database by Id and userId
  const findBot = await Bot.findOne(
    {
      user: user._id,
      _id: id
    }
  );
  // If no result, return error
  if (findBot === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  const botResponse = (({ _id, name, personality, photo, files, timestamp }) => ({ _id, name, personality, photo, files, timestamp }))(findBot);
  res.json(new ValidResponse(botResponse));
}

async function list(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  // Look for the bot in the database by userId
  const listBots = await Bot.find(
    {
      user: user._id
    }
  );
  // If no result, return error
  if (listBots === null) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  const botResponse = listBots.map(item => (({ _id, name, personality, photo, files, timestamp }) => ({ _id, name, personality, photo, files, timestamp }))(item));
  res.json(new ValidResponse(botResponse));
}

async function create(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const name: ParamValue = req.body.name;
  const personality: ParamValue = req.body.personality;
  const photo: ParamValue = req.body.photo;

  // Check if all required values is defined
  if (name === undefined || personality === undefined || photo === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look if the name is available
  const findBot = await Bot.findOne(
    {
      user: user._id,
      name
    }
  );
  // If bot with that name already exists, return error
  if (findBot !== null) {
    res.json(new ErrorResponse(ErrorType.BOT_EXISTS));
    return;
  }

  // Create a new bot in the database
  const createBot = await Bot.create(
    {
      user: user._id,
      name,
      personality,
      photo
    }
  );
  // If something went wrong, return an error
  if (createBot === null) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // If all good, return JWT token
  res.json(new ValidResponse({ id: createBot._id }));
}

async function remove(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: ParamValue = req.body.id;

  // Check if all required values is defined
  if (id === undefined || !Types.ObjectId.isValid(id)) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look for the bot in the database by Id and userId
  const findBot = await Bot.findOne(
    {
      user: user._id,
      _id: id
    }
  );
  // If no result, return error
  if (findBot === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // Delete the bot from the database by id and userId
  const deleteBot = await Bot.deleteOne(
    {
      user: user._id,
      _id: id
    }
  );
  // If something went wrong, return an error
  if (deleteBot.acknowledged === false) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // If all good, return OK
  res.json(new ValidResponse());
}

export default { find, list, create, remove }