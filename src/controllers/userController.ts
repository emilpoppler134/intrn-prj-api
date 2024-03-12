import { Types } from 'mongoose';
import { AccessToken } from '../models/AccessToken.js';
import { ResetPasswordToken } from '../models/ResetPasswordToken.js';
import { User } from '../models/User.js';
import { createAccessToken } from '../lib/createAccessToken.js';
import { hashPassword } from '../lib/hashPassword.js';
import { sendResetPasswordToken } from '../lib/sendResetPasswordToken.js';
import { ValidResponse, ErrorResponse, EError, EStatus } from '../lib/response.js';

import type { DeleteResult, UpdateResult } from 'mongodb';
import type { Request, Response } from 'express';
import type { IAccessToken } from '../models/AccessToken.js';
import type { IResetPasswordToken } from '../models/ResetPasswordToken.js';
import type { IUser } from '../models/User.js';
import type { IPasswordHash } from '../lib/hashPassword.js';

enum ESearchMode {
  Id = "Id",
  Token = "AccessToken"
}

type IParamValue = string | undefined;
type ISearchModeParamValue = ESearchMode | undefined;

type IUserAction = IUser | null;
type IAccessTokenAction = IAccessToken | null;
type IResetPasswordTokenAction = IResetPasswordToken | null;
type IAccessTokenUserExtendedAction = (Omit<IAccessToken, 'user'> & { user: IUser | null }) | null;

async function find(req: Request, res: Response) {
  const mode: ISearchModeParamValue = req.body.mode;
  const id: IParamValue = req.body.id;
  const token: IParamValue = req.body.accessToken;

  // Check if required mode value are defined
  if (mode === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  switch (mode) {
    case ESearchMode.Id: {
      // Check if required id value are defined
      if (id === undefined || !Types.ObjectId.isValid(id)) {
        res.json(new ErrorResponse(EError.INVALID_PARAMS));
        return;
      }

      // Look for the user in the database by id
      const findUser: IUserAction = await User.findOne(
        {
          _id: id
        }
      )

      // If there is no user with that id, return error
      if (findUser === null) {
        res.json(new ErrorResponse(EError.NO_RESULT));
        return;
      }

      const userResponse = (({ _id, name, email, timestamp }) => ({ _id, name, email, timestamp }))(findUser);

      res.json(new ValidResponse(userResponse));
    } break;

    case ESearchMode.Token: {
      // Check if required token value are defined
      if (token === undefined) {
        res.json(new ErrorResponse(EError.INVALID_PARAMS));
        return;
      }

      // Look for the access token in the database and extend the user
      const findAccessTokenUserExtended: IAccessTokenUserExtendedAction = await AccessToken.findOne(
        {
          token: token
        }
      )
      .populate({ path: "user", model: "User" });

      // If there is no access token or user with provided token, return error
      if (findAccessTokenUserExtended === null || findAccessTokenUserExtended.user === null) {
        res.json(new ErrorResponse(EError.NO_RESULT));
        return;
      }

      const userResponse = (({ _id, name, email, timestamp }) => ({ _id, name, email, timestamp }))(findAccessTokenUserExtended.user);

      res.json(new ValidResponse(userResponse));
    } break;
  
    default: {
      res.json(new ErrorResponse(EError.INVALID_PARAMS));
    } break;
  }
}

async function login(req: Request, res: Response) {
  const email: IParamValue = req.body.email;
  const password: IParamValue = req.body.password;

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
  const findUser: IUserAction = await User.findOne(
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
  const createAccessTokenResponse: IAccessTokenAction = await AccessToken.create(
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
  const name: IParamValue = req.body.name;
  const email: IParamValue = req.body.email;
  const password: IParamValue = req.body.password;

  // Check if all required values are defined
  if (name === undefined || email === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  // Look if the email is available
  const findUser: IUserAction = await User.findOne(
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
  const createUser: IUserAction = await User.create(
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
  const createAccessTokenResponse: IAccessTokenAction = await AccessToken.create(
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

async function logout(req: Request, res: Response) {
  const token: IParamValue = req.body.accessToken;

  // Check if all required values are defined
  if (token === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  const deleteAccessToken: DeleteResult = await AccessToken.deleteMany(
    {
      token: token
    }
  );
  // If something went wrong, return an error
  if (deleteAccessToken.acknowledged === false) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  res.json(new ValidResponse());
}

async function forgotPasswordRequest(req: Request, res: Response) {
  const email: IParamValue = req.body.email;

  // Check if all required values are defined
  if (email === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser: IUserAction = await User.findOne(
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
  const createResetPasswordToken: IResetPasswordTokenAction = await ResetPasswordToken.create(
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
  const email: IParamValue = req.body.email;
  const code: IParamValue = req.body.code;
  const password: IParamValue = req.body.password;

  // Check if all required values are defined
  if (email === undefined || code === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser: IUserAction = await User.findOne(
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
  const findResetPasswordToken: IResetPasswordTokenAction = await ResetPasswordToken.findOne(
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
  const updateResetPasswordToken: UpdateResult = await ResetPasswordToken.updateOne(
    { _id: findResetPasswordToken._id },
    { consumed: true }
  );
  // If something went wrong, return an error
  if (updateResetPasswordToken.acknowledged === false) {
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
  const updateUser: UpdateResult = await User.updateOne(
    { _id: findUser._id },
    { password_hash: passwordHash }
  );
  // If something went wrong, return an error
  if (updateUser.acknowledged === false) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  // If all good, return OK
  res.json(new ValidResponse());
}

export default { find, login, signup, logout, forgotPasswordRequest, forgotPasswordConfirmation }