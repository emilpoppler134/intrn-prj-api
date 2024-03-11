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

type IFindUserResponse = IUser | null;
type ICreateUserResponse = IUser | null;

type ICreateResetPasswordTokenResponse = IResetPasswordToken | null;

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

  const findUserResponse: IFindUserResponse = await User.findOne(
    {
      "email": email,
      "password_hash": passwordHash
    }
  );

  if (findUserResponse === null) {
    res.json(new ErrorResponse(EError.NO_RESULT));
    return;
  }

  const token: string = await createToken();

  const insertUserTokenResponse = await User.updateOne(
    { _id: findUserResponse._id }, 
    { $push: { tokens: token } }
  );

  if (insertUserTokenResponse === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  console.log(insertUserTokenResponse)

  res.json(new ValidResponse({ token }));
}

async function signup(req: Request, res: Response) {
  const { name, email, password }: { name: IName, email: IEmail, password: IPassword } = req.body;

  if (name === undefined || email === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  const findUserResponse: IFindUserResponse = await User.findOne(
    {
      "email": email
    }
  );

  if (findUserResponse !== null) {
    res.json(new ErrorResponse(EError.USER_EXISTS));
    return;
  }

  const passwordHash: IPasswordHash = hashPassword(password);

  if (passwordHash === null) {
    res.json(new ErrorResponse(EError.HASH_PARSING));
    return;
  }

  const token: string = await createToken();

  const createUserResponse: ICreateUserResponse = await User.create(
    {
      "name": name,
      "email": email,
      "password_hash": passwordHash,
      "tokens": [ token ]
    }
  );

  if (createUserResponse === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  res.json(new ValidResponse({ token }));
}

async function forgotPasswordRequest(req: Request, res: Response) {
  const email: IEmail = req.body.email;

  const findUserResponse: IFindUserResponse = await User.findOne(
    {
      "email": email
    }
  );

  if (findUserResponse === null) {
    res.json(new ErrorResponse(EError.NO_RESULT));
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000);

  const resetPasswordTokenResponse: ICreateResetPasswordTokenResponse = await ResetPasswordToken.create(
    {
      "code": code,
      "user": findUserResponse._id
    }
  );

  if (resetPasswordTokenResponse === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  const sendResetPasswordTokenResponse: EStatus = await sendResetPasswordToken(findUserResponse.email, findUserResponse.name, code);

  if (sendResetPasswordTokenResponse === EStatus.ERROR) {
    res.json(new ErrorResponse(EError.MAIL_ERROR));
    return;
  }

  res.json(new ValidResponse());
}

async function forgotPasswordConfirmation(req: Request, res: Response) {
  const email: IEmail = req.body.email;
  const code: ICode = req.body.code;
  
  res.json({ email, code });
}

export default { login, signup, forgotPasswordRequest, forgotPasswordConfirmation }