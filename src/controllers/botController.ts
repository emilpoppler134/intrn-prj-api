import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ReplicateStream } from "ai";
import crypto from "crypto";
import { Request, Response } from "express";
import mime from "mime";
import { DeleteResult, UpdateResult } from "mongodb";
import { Types } from "mongoose";
import Replicate from "replicate";
import { Readable } from "stream";
import {
  API_ADDRESS,
  REPLICATE_API_TOKEN,
  S3_ACCESS_KEY_ID,
  S3_BUCKET_NAME,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
} from "../config.js";
import { Bot, FileItem, IBot, PromptItem } from "../models/Bot.js";
import { Configuration, IConfiguration } from "../models/Configuration.js";
import { ILanguage, Language } from "../models/Language.js";
import { IModel, Model } from "../models/Model.js";
import { IPrompt, Prompt } from "../models/Prompt.js";
import { NumberParam, ParamValue } from "../types/ParamValue.js";
import { ErrorCode, SuccessCode } from "../types/StatusCode.js";
import { TokenPayload } from "../types/TokenPayload.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

const client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

const allowedFileTypes = ["json", "txt"];

type BotExtended = Omit<
  IBot,
  "language" | "model" | "configuration" | "prompts"
> & {
  language: ILanguage;
  model: IModel;
  configuration: IConfiguration;
  prompts: Array<Omit<PromptItem, "option"> & { option: IPrompt }>;
};

type BotResponse = {
  id: string;
  name: string;
  photo: string | null;
  language: ILanguage;
  prompts: Array<Omit<PromptItem, "option"> & { option: IPrompt }>;
  model: IModel;
  configuration: IConfiguration;
  maxTokens: number;
  temperature: number;
  topP: number;
  files: Array<FileItem & { url: string }>;
  timestamp: number;
};

type FindBotResponse = {
  bot: BotResponse;
  languages: Array<ILanguage>;
  models: Array<IModel>;
  configurations: Array<IConfiguration>;
  prompts: Array<IPrompt>;
};

type ListBotResponse = Array<{
  id: string;
  name: string;
  photo: string | null;
}>;

type CreateBotResponse = {
  id: string;
};

const isValidConfiguration = (bot: BotExtended): boolean =>
  (bot.configuration.name === "custom" &&
    bot.maxTokens !== null &&
    bot.temperature !== null &&
    bot.topP !== null) ||
  (bot.configuration.name !== "custom" &&
    bot.configuration.data !== null &&
    bot.configuration.data.maxTokens !== null &&
    bot.configuration.data.temperature !== null &&
    bot.configuration.data.topP !== null);

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
  })
    .populate({ path: "language", model: "Language" })
    .populate({ path: "model", model: "Model" })
    .populate({ path: "prompts.option", model: "Prompt" })
    .populate({ path: "configuration", model: "Configuration" });

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

  const listConfigurations: Array<IConfiguration> | null =
    await Configuration.find();

  if (listConfigurations === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when fetching the configurations.",
    );
  }

  const listPrompts: Array<IPrompt> | null = await Prompt.find();

  if (listPrompts === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when fetching the prompts.",
    );
  }

  const listLanguages: Array<ILanguage> | null = await Language.find();

  if (listLanguages === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when fetching the languages.",
    );
  }

  if (!isValidConfiguration(findBot)) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "Something is wrong with your bot, try removing it and create a new one.",
    );
  }

  const botConfiguration =
    findBot.configuration.name === "custom"
      ? {
          maxTokens: findBot.maxTokens!,
          temperature: findBot.temperature!,
          topP: findBot.topP!,
        }
      : {
          maxTokens: findBot.configuration.data!.maxTokens,
          temperature: findBot.configuration.data!.temperature,
          topP: findBot.configuration.data!.topP,
        };

  const botResponse: FindBotResponse = {
    bot: {
      id: findBot._id.toString(),
      name: findBot.name,
      photo: findBot.photo,
      language: findBot.language,
      prompts: findBot.prompts,
      model: findBot.model,
      configuration: findBot.configuration,
      maxTokens: botConfiguration.maxTokens,
      temperature: botConfiguration.temperature,
      topP: botConfiguration.topP,
      files: findBot.files.map((item) => ({
        _id: item._id,
        key: item.key,
        name: item.name,
        type: item.type,
        size: item.size,
        url: `${API_ADDRESS}/bots/${findBot._id.toString()}/files/${item._id.toString()}/download`,
      })),
      timestamp: Math.floor(new Date(findBot.timestamp).getTime() / 1000),
    },
    languages: listLanguages,
    models: listModels,
    configurations: listConfigurations,
    prompts: listPrompts,
  };

  return sendValidResponse<FindBotResponse>(res, SuccessCode.OK, botResponse);
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

  const botResponse: ListBotResponse = listBots.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    photo: item.photo,
  }));

  return sendValidResponse<ListBotResponse>(res, SuccessCode.OK, botResponse);
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

  const findConfiguration = await Configuration.findOne({
    name: "default",
  });

  if (findConfiguration === null) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "Something went wrong when setting the bot configuration.",
    );
  }

  const findModel = await Model.findOne({
    name: "meta/llama-2-70b-chat",
  });

  if (findModel === null) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "Something went wrong when setting the bot model.",
    );
  }

  const findPrompt = await Prompt.findOne({
    name: "who-are-you",
  });

  if (findPrompt === null) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "Something went wrong when setting the bot prompt.",
    );
  }

  const findLanguage = await Language.findOne({
    name: "english",
  });

  if (findLanguage === null) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "Something went wrong when setting the bot language.",
    );
  }

  // Create a new bot in the database
  const createBot = await Bot.create({
    user: user._id,
    name,
    language: findLanguage._id,
    prompts: [
      {
        option: findPrompt._id,
        value: `You are a helpful assistant called ${name}`,
      },
    ],
    configuration: findConfiguration._id,
    model: findModel._id,
  });
  // If something went wrong, return an error
  if (createBot === null) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when creating the bot.",
    );
  }

  const botResponse: CreateBotResponse = {
    id: createBot._id.toString(),
  };

  // If all good, return the bot Id.
  return sendValidResponse<CreateBotResponse>(
    res,
    SuccessCode.CREATED,
    botResponse,
  );
}

async function update(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;

  const name: ParamValue = req.body.name;
  const photo: ParamValue = req.body.photo;
  const language: ParamValue = req.body.language;
  const prompts: Array<PromptItem> = req.body.prompts;
  const configuration: ParamValue = req.body.configuration;
  const model: ParamValue = req.body.model;
  const maxTokens: NumberParam = req.body.maxTokens;
  const temperature: NumberParam = req.body.temperature;
  const topP: NumberParam = req.body.topP;

  if (
    !Types.ObjectId.isValid(id) ||
    name === undefined ||
    language === undefined ||
    !Types.ObjectId.isValid(language) ||
    prompts === undefined ||
    prompts.length <= 0 ||
    prompts.some(
      (item) =>
        !Types.ObjectId.isValid(item.option) || item.value.trim() === "",
    ) ||
    configuration === undefined ||
    !Types.ObjectId.isValid(configuration) ||
    model === undefined ||
    !Types.ObjectId.isValid(model)
  ) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  const updateUser: UpdateResult = await Bot.updateOne(
    { user: user._id, _id: id },
    {
      name,
      photo: photo ?? null,
      language,
      prompts: prompts.map((item) => ({
        option: new Types.ObjectId(item.option),
        value: item.value,
      })),
      configuration,
      model,
      maxTokens,
      temperature,
      topP,
    },
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
  })
    .populate({ path: "model", model: "Model" })
    .populate({ path: "configuration", model: "Configuration" });

  // If no result, return error
  if (findBot === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "There is no bot with that Id.",
    );
  }

  if (!isValidConfiguration(findBot)) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "Something is wrong with your bot, try removing it and create a new one.",
    );
  }

  const botConfiguration =
    findBot.configuration.name === "custom"
      ? {
          maxTokens: findBot.maxTokens!,
          temperature: findBot.temperature!,
          topP: findBot.topP!,
        }
      : {
          maxTokens: findBot.configuration.data!.maxTokens,
          temperature: findBot.configuration.data!.temperature,
          topP: findBot.configuration.data!.topP,
        };

  const llamaResponse = await replicate.predictions.create({
    model: findBot.model.name,
    stream: true,
    input: {
      prompt: `${prompt}`,
      max_new_tokens: findBot.maxTokens,
      ...(findBot.model.name.includes("llama3")
        ? { max_tokens: botConfiguration.maxTokens }
        : { max_new_tokens: botConfiguration.maxTokens }),
      temperature: botConfiguration.temperature,
      repetition_penalty: 1,
      top_p: botConfiguration.topP,
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

async function downloadFile(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;
  const file: string = req.params.file;

  if (id === undefined || !Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid bot id.");
  }

  if (file === undefined || !Types.ObjectId.isValid(file)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid file id.");
  }

  const findBot = await Bot.findOne({ _id: id, user: user._id });

  if (findBot === null) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "You dont have access to this bot.",
    );
  }

  const findFile = findBot.files.find((item) => item._id.toString() === file);

  if (findFile === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "The file doesn't exist.");
  }

  const fileName = `${findFile.name}.${findFile.type}`;
  const mimeType = mime.getType(findFile.type);

  if (mimeType === null) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "The file cant't be downloaded.",
    );
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: `bots/${findFile.key}.${findFile.type}`,
  });

  try {
    const response = await client.send(command);
    const stream = response.Body as Readable;

    res.setHeader("Content-disposition", "attachment; filename=" + fileName);
    res.setHeader("Content-type", mimeType);
    stream.pipe(res);
  } catch (err: unknown) {
    throw err instanceof Error
      ? new ErrorResponse(ErrorCode.SERVER_ERROR, "Couldn't download the file.")
      : new Error("Something went wrong");
  }
}

async function uploadFile(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;
  const files = req.files;

  if (id === undefined || !Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid bot id.");
  }

  if (!files || !files.file || files.file instanceof Array) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "No files attached.");
  }

  const key: string = crypto.randomUUID();
  const name = files.file.name.split(".").shift();
  const type = files.file.name.split(".").pop();
  const size = files.file.size;

  if (name === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid file name.");
  }

  if (type === undefined || !allowedFileTypes.includes(type)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid file type.");
  }

  const findBot = await Bot.findOne({ _id: id, user: user._id });

  if (findBot === null) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "You dont have access to this bot.",
    );
  }

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: `bots/${key}.${type}`,
    Body: files.file.data,
  });

  try {
    await client.send(command);

    await Bot.updateOne(
      { _id: id },
      { $push: { files: { key, name, type, size } } },
    );

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (err: unknown) {
    throw err instanceof Error
      ? new ErrorResponse(ErrorCode.SERVER_ERROR, "Couldn't upload file.")
      : new Error("Something went wrong");
  }
}

async function removeFile(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const id: string = req.params.id;
  const file: ParamValue = req.body.file;

  if (id === undefined || !Types.ObjectId.isValid(id)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid bot id.");
  }

  if (file === undefined || !Types.ObjectId.isValid(file)) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid file id.");
  }

  const findBot = await Bot.findOne({ _id: id, user: user._id });

  if (findBot === null) {
    throw new ErrorResponse(
      ErrorCode.CONFLICT,
      "You dont have access to this bot.",
    );
  }

  const findFile = findBot.files.find((item) => item._id.toString() === file);

  if (findFile === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "The file doesn't exist.");
  }

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: `bots/${findFile.key}.${findFile.type}`,
  });

  try {
    await client.send(command);

    await Bot.updateOne({ _id: id }, { $pull: { files: { _id: file } } });

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (err: unknown) {
    throw err instanceof Error
      ? new ErrorResponse(ErrorCode.SERVER_ERROR, "Couldn't remove the file.")
      : new Error("Something went wrong");
  }
}

export default {
  find,
  list,
  create,
  update,
  remove,
  chat,
  downloadFile,
  uploadFile,
  removeFile,
};
