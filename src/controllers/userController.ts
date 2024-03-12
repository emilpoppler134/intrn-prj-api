import { User } from '../models/User.js';
import { ResetPasswordToken } from '../models/ResetPasswordToken.js';
import { ValidResponse, ErrorResponse, EError, EStatus } from '../lib/response.js';
import { hashPassword } from '../lib/hashPassword.js';
import { createToken } from '../lib/createToken.js';
import { sendResetPasswordToken } from '../lib/sendResetPasswordToken.js';

import type { Request, Response } from 'express';
import type { IUser } from '../models/User.js';
import type { IResetPasswordToken } from '../models/ResetPasswordToken.js';
import type { IPasswordHash } from '../lib/hashPassword.js';

type IName = string | undefined;
type IEmail = string | undefined;
type IPassword = string | undefined;
type ICode = string | undefined;

type IFindUser = IUser | null;
type ICreateUser = IUser | null;

type ICreateResetPasswordToken = IResetPasswordToken | null;

async function login(req: Request, res: Response) {
  const { email, password }: { email: IEmail, password: IPassword } = req.body;

  if (email === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  const passwordHash: IPasswordHash = hashPassword(password);

  if (passwordHash === null) {
    res.json(new ErrorResponse(EError.HASH_PARSING));
    return;
  }

  const findUser: IFindUser = await User.findOne(
    {
      "email": email,
      "password_hash": passwordHash
    }
  );

  if (findUser === null) {
    res.json(new ErrorResponse(EError.NO_RESULT));
    return;
  }

  const token: string = await createToken();

  const updateUserToken = await User.updateOne(
    { _id: findUser._id }, 
    { $push: { tokens: token } }
  );

  if (updateUserToken === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  res.json(new ValidResponse({ token }));
}

async function signup(req: Request, res: Response) {
  const { name, email, password }: { name: IName, email: IEmail, password: IPassword } = req.body;

  if (name === undefined || email === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  const findUser: IFindUser = await User.findOne(
    {
      "email": email
    }
  );

  if (findUser !== null) {
    res.json(new ErrorResponse(EError.USER_EXISTS));
    return;
  }

  const passwordHash: IPasswordHash = hashPassword(password);

  if (passwordHash === null) {
    res.json(new ErrorResponse(EError.HASH_PARSING));
    return;
  }

  const token: string = await createToken();

  const createUser: ICreateUser = await User.create(
    {
      "name": name,
      "email": email,
      "password_hash": passwordHash,
      "tokens": [ token ]
    }
  );

  if (createUser === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  res.json(new ValidResponse({ token }));
}

async function forgotPasswordRequest(req: Request, res: Response) {
  const email: IEmail = req.body.email;

  if (email === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  const findUser: IFindUser = await User.findOne(
    {
      "email": email
    }
  );

  if (findUser === null) {
    res.json(new ErrorResponse(EError.NO_RESULT));
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000);

  const createResetPasswordToken: ICreateResetPasswordToken = await ResetPasswordToken.create(
    {
      "code": code,
      "user": findUser._id
    }
  );

  if (createResetPasswordToken === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  const sendResetPasswordTokenStatus: EStatus = await sendResetPasswordToken(findUser.email, findUser.name, code);

  if (sendResetPasswordTokenStatus === EStatus.ERROR) {
    res.json(new ErrorResponse(EError.MAIL_ERROR));
    return;
  }

  res.json(new ValidResponse());
}

async function forgotPasswordConfirmation(req: Request, res: Response) {
  const email: IEmail = req.body.email;
  const code: ICode = req.body.code;
  const password: IPassword = req.body.password;

  if (email === undefined || code === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  const findUser: IFindUser = await User.findOne(
    {
      "email": email
    }
  );

  if (findUser === null) {
    res.json(new ErrorResponse(EError.NO_RESULT));
    return;
  }
  
  const updateResetPasswordToken = await ResetPasswordToken.findOneAndUpdate(
    { "user": findUser._id, "code": code, "consumed": false },
    { consumed: true }
  );

  if (updateResetPasswordToken === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  const passwordHash: IPasswordHash = hashPassword(password);

  if (passwordHash === null) {
    res.json(new ErrorResponse(EError.HASH_PARSING));
    return;
  }

  const updateUser = await User.updateOne(
    { "_id": findUser._id },
    { "password_hash": passwordHash }
  );

  if (updateUser === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  res.json(new ValidResponse());
}

export default { login, signup, forgotPasswordRequest, forgotPasswordConfirmation }