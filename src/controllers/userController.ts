import { AccessToken } from '../models/AccessToken.js';
import { ResetPasswordToken } from '../models/ResetPasswordToken.js';
import { User } from '../models/User.js';
import { createAccessToken } from '../lib/createAccessToken.js';
import { hashPassword } from '../lib/hashPassword.js';
import { sendResetPasswordToken } from '../lib/sendResetPasswordToken.js';
import { ValidResponse, ErrorResponse, EError, EStatus } from '../lib/response.js';

import type { Request, Response } from 'express';
import type { IAccessToken } from '../models/AccessToken.js';
import type { IResetPasswordToken } from '../models/ResetPasswordToken.js';
import type { IUser } from '../models/User.js';
import type { IPasswordHash } from '../lib/hashPassword.js';

type IName = string | undefined;
type IEmail = string | undefined;
type IPassword = string | undefined;
type ICode = string | undefined;

type IFindUser = IUser | null;
type ICreateUser = IUser | null;
type IUpdateUser = IUser | null;

type ICreateAccessToken = IAccessToken | null;

type ICreateResetPasswordToken = IResetPasswordToken | null;
type IUpdateResetPasswordToken = IResetPasswordToken | null;

async function login(req: Request, res: Response) {
  const email: IEmail = req.body.email;
  const password: IEmail = req.body.password;

  // Check if all required values are defined
  if (email === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  // Hash the password 
  const passwordHash: IPasswordHash = hashPassword(password);
  if (passwordHash === null) {
    res.json(new ErrorResponse(EError.HASH_PARSING));
    return;
  }

  // Look for the user in the database by email and password
  const findUser: IFindUser = await User.findOne(
    {
      email: email,
      password_hash: passwordHash
    }
  );
  // If no result, return an error
  if (findUser === null) {
    res.json(new ErrorResponse(EError.NO_RESULT));
    return;
  }

  // Create an access token
  const token: string = await createAccessToken();

  // Create a new access token in the database
  const createAccessTokenResponse = await AccessToken.create(
    {
      user: findUser._id,
      token: token
    }
  );
  // If something went wrong, return an error
  if (createAccessTokenResponse === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  // If all good, return token
  res.json(new ValidResponse({ token }));
}

async function signup(req: Request, res: Response) {
  const name: IName = req.body.name;
  const email: IEmail = req.body.email;
  const password: IPassword = req.body.password;

  // Check if all required values are defined
  if (name === undefined || email === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  // Look if the email is available
  const findUser: IFindUser = await User.findOne(
    {
      email: email
    }
  );
  // If user with that email already exists, return error
  if (findUser !== null) {
    res.json(new ErrorResponse(EError.USER_EXISTS));
    return;
  }

  // Hash the password
  const passwordHash: IPasswordHash = hashPassword(password);
  if (passwordHash === null) {
    res.json(new ErrorResponse(EError.HASH_PARSING));
    return;
  }

  // Create a new user in the database
  const createUser: ICreateUser = await User.create(
    {
      name: name,
      email: email,
      password_hash: passwordHash
    }
  );
  // If something went wrong, return an error
  if (createUser === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  // Create an access token
  const token: string = await createAccessToken();

  // Create a new access token in the database
  const createAccessTokenResponse: ICreateAccessToken = await AccessToken.create(
    {
      user: createUser._id,
      token: token
    }
  );
  // If something went wrong, return an error
  if (createAccessTokenResponse === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  // If all good, return token
  res.json(new ValidResponse({ token }));
}

async function forgotPasswordRequest(req: Request, res: Response) {
  const email: IEmail = req.body.email;

  // Check if all required values are defined
  if (email === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser: IFindUser = await User.findOne(
    {
      email: email
    }
  );
  // If there is no user with that email, return error
  if (findUser === null) {
    res.json(new ErrorResponse(EError.NO_RESULT));
    return;
  }

  // Create a reset password token
  const code = Math.floor(100000 + Math.random() * 900000);

  // Create a new reset password token in the database
  const createResetPasswordToken: ICreateResetPasswordToken = await ResetPasswordToken.create(
    {
      code: code,
      user: findUser._id
    }
  );
  // If something went wrong, return an error
  if (createResetPasswordToken === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  // Send an email to the user with the reset password token
  const sendResetPasswordTokenStatus: EStatus = await sendResetPasswordToken(findUser.email, findUser.name, code);
  // If something went wrong, return an error
  if (sendResetPasswordTokenStatus === EStatus.ERROR) {
    res.json(new ErrorResponse(EError.MAIL_ERROR));
    return;
  }

  // If all good, return OK
  res.json(new ValidResponse());
}

async function forgotPasswordConfirmation(req: Request, res: Response) {
  const email: IEmail = req.body.email;
  const code: ICode = req.body.code;
  const password: IPassword = req.body.password;

  // Check if all required values are defined
  if (email === undefined || code === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser: IFindUser = await User.findOne(
    {
      email: email
    }
  );
  // If there is no user with that email, return error
  if (findUser === null) {
    res.json(new ErrorResponse(EError.NO_RESULT));
    return;
  }
  
  // Look for a reset password token in the database
  // By user user id, reset password code and if the token isn't already consumed
  const findResetPasswordToken = await ResetPasswordToken.findOne(
    {
      user: findUser._id,
      "code": code,
      "consumed": false
    }
  );
  // If there is no result, return error
  if (findResetPasswordToken === null) {
    res.json(new ErrorResponse(EError.NO_RESULT));
    return;
  }
  
  // Update the reset password token to consumed
  const updateResetPasswordToken: IUpdateResetPasswordToken = await ResetPasswordToken.findOneAndUpdate(
    { _id: findResetPasswordToken._id },
    { consumed: true },
    { new: true }
  );
  // If something went wrong, return an error
  if (updateResetPasswordToken === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  // Hash the new password
  const passwordHash: IPasswordHash = hashPassword(password);
  if (passwordHash === null) {
    res.json(new ErrorResponse(EError.HASH_PARSING));
    return;
  }

  // Update the user password in the database
  const updateUser: IUpdateUser = await User.findOneAndUpdate(
    { _id: findUser._id },
    { password_hash: passwordHash },
    { new: true }
  );

   // If something went wrong, return an error
  if (updateUser === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  // If all good, return OK
  res.json(new ValidResponse());
}

export default { login, signup, forgotPasswordRequest, forgotPasswordConfirmation }