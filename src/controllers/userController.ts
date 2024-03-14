import { Types } from 'mongoose';
import { AccessToken } from '../models/AccessToken.js';
import { VerificationToken } from '../models/VerificationToken.js';
import { User } from '../models/User.js';
import { createAccessToken } from '../lib/createAccessToken.js';
import { hashPassword } from '../lib/hashPassword.js';
import { VerificationType, sendVerificationToken } from '../lib/transmitMail.js';
import { ValidResponse, ErrorResponse, ErrorType } from '../lib/response.js';

import type { DeleteResult, UpdateResult } from 'mongodb';
import type { Request, Response } from 'express';
import type { IAccessToken } from '../models/AccessToken.js';
import type { IVerificationToken } from '../models/VerificationToken.js';
import type { IUser } from '../models/User.js';
import type { PasswordHash } from '../lib/hashPassword.js';

enum SearchMode {
  Id = "Id",
  Token = "AccessToken"
}

type ParamValue = string | undefined;
type SearchModeParamValue = SearchMode | undefined;

type UserAction = IUser | null;
type AccessTokenAction = IAccessToken | null;
type VerificationTokenAction = IVerificationToken | null;
type AccessTokenUserExtendedAction = (Omit<IAccessToken, 'user'> & { user: IUser | null }) | null;

async function find(req: Request, res: Response) {
  const mode: SearchModeParamValue = req.body.mode;
  const id: ParamValue = req.body.id;
  const token: ParamValue = req.body.accessToken;

  // Check if required mode value is defined
  if (mode === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  switch (mode) {
    case SearchMode.Id: {
      // Check if required id value is defined
      if (id === undefined || !Types.ObjectId.isValid(id)) {
        res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
        return;
      }

      // Look for the user in the database by id
      const findUser: UserAction = await User.findOne(
        {
          _id: id
        }
      )
      // If there is no user with that id, return error
      if (findUser === null) {
        res.json(new ErrorResponse(ErrorType.NO_RESULT));
        return;
      }

      // Return valid with only some fields
      const userResponse = (({ _id, name, email, timestamp }) => ({ _id, name, email, timestamp }))(findUser);
      res.json(new ValidResponse(userResponse));
    } break;

    case SearchMode.Token: {
      // Check if required token value is defined
      if (token === undefined) {
        res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
        return;
      }

      // Look for the access token in the database and extend the user
      const findAccessTokenUserExtended: AccessTokenUserExtendedAction = await AccessToken.findOne(
        {
          token: token
        }
      )
      .populate({ path: "user", model: "User" });

      // If there is no access token or user with provided token, return error
      if (findAccessTokenUserExtended === null || findAccessTokenUserExtended.user === null) {
        res.json(new ErrorResponse(ErrorType.NO_RESULT));
        return;
      }

      // Return valid with only some fields
      const userResponse = (({ _id, name, email, timestamp }) => ({ _id, name, email, timestamp }))(findAccessTokenUserExtended.user);
      res.json(new ValidResponse(userResponse));
    } break;
  
    default: {
      res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    } break;
  }
}

async function login(req: Request, res: Response) {
  const email: ParamValue = req.body.email;
  const password: ParamValue = req.body.password;

  // Check if all required values is defined
  if (email === undefined || password === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Hash the password 
  const passwordHash: PasswordHash = hashPassword(password);
  if (passwordHash === null) {
    res.json(new ErrorResponse(ErrorType.HASH_PARSING));
    return;
  }

  // Look for the user in the database by email and password
  const findUser: UserAction = await User.findOne(
    {
      email: email,
      password_hash: passwordHash
    }
  );
  // If no result, return an error
  if (findUser === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // Create a random UUID token
  const token: string = await createAccessToken();

  // Create a new access token in the database
  const createAccessTokenResponse: AccessTokenAction = await AccessToken.create(
    {
      user: findUser._id,
      token: token
    }
  );
  // If something went wrong, return an error
  if (createAccessTokenResponse === null) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // If all good, return token
  res.json(new ValidResponse({ accessToken: token }));
}

async function logout(req: Request, res: Response) {
  const token: ParamValue = req.body.accessToken;

  // Check if required accessToken value is defined
  if (token === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Delete all accessTokens in database that has provided token
  const deleteAccessToken: DeleteResult = await AccessToken.deleteMany(
    {
      token: token
    }
  );
  // If something went wrong, return an error
  if (deleteAccessToken.acknowledged === false) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  res.json(new ValidResponse());
}

async function signupRequest(req: Request, res: Response) {
  const name: ParamValue = req.body.name;
  const email: ParamValue = req.body.email;

  // Check if all required values is defined
  if (name === undefined || email === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look if the email is available
  const findUser: UserAction = await User.findOne(
    {
      email: email
    }
  );
  // If user with that email already exists, return error
  if (findUser !== null) {
    res.json(new ErrorResponse(ErrorType.USER_EXISTS));
    return;
  }

  // Delete all verification tokens in database that has provided email and that isn't consumed
  const deleteVerificationToken: DeleteResult = await VerificationToken.deleteMany(
    {
      email,
      consumed: false
    }
  );
  // If something went wrong, return an error
  if (deleteVerificationToken.acknowledged === false) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // Create a verification code
  const code = Math.floor(100000 + Math.random() * 900000);

  // Create a new verification token in the database
  const createVerificationToken: VerificationTokenAction = await VerificationToken.create(
    {
      code: code,
      email: email
    }
  );
  // If something went wrong, return an error
  if (createVerificationToken === null) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // Send an email to the user with the verification token
  try {
    await sendVerificationToken(VerificationType.Signup, name, email, code);
  } catch {
    res.json(new ErrorResponse(ErrorType.MAIL_ERROR));
    return;
  }

  // If all good, return OK
  res.json(new ValidResponse());
}

async function signupConfirmation(req: Request, res: Response) {
  const email: ParamValue = req.body.email;
  const code: ParamValue = req.body.code;

  // Check if all required values is defined
  if (email === undefined || code === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }
  
  // Look for a verification token in the database 
  // By email, verification code and if the token isn't already consumed
  const findVerificationToken: VerificationTokenAction = await VerificationToken.findOne(
    {
      email,
      code: parseInt(code),
      consumed: false
    }
  );
  // If there is no result, return error
  if (findVerificationToken === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // If all good, return OK
  res.json(new ValidResponse());
}

async function signupSubmit(req: Request, res: Response) {
  const name: ParamValue = req.body.name;
  const email: ParamValue = req.body.email;
  const code: ParamValue = req.body.code;
  const password: ParamValue = req.body.password;

  // Check if all required values is defined
  if (name === undefined || email === undefined || code === undefined || password === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look if the email is available
  const findUser: UserAction = await User.findOne(
    {
      email: email
    }
  );
  // If user with that email already exists, return error
  if (findUser !== null) {
    res.json(new ErrorResponse(ErrorType.USER_EXISTS));
    return;
  }

  // Look for a verification token in the database 
  // By email, verification code and if the token isn't already consumed
  const findVerificationToken: VerificationTokenAction = await VerificationToken.findOne(
    {
      email,
      code: parseInt(code),
      consumed: false
    }
  );
  // If there is no result, return error
  if (findVerificationToken === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // Hash the password
  const passwordHash: PasswordHash = hashPassword(password);
  if (passwordHash === null) {
    res.json(new ErrorResponse(ErrorType.HASH_PARSING));
    return;
  }

  // Create a new user in the database
  const createUser: UserAction = await User.create(
    {
      name: name,
      email: email,
      password_hash: passwordHash
    }
  );
  // If something went wrong, return an error
  if (createUser === null) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // Create a random UUID token
  const token: string = await createAccessToken();

  // Add a new access token in the database
  const createAccessTokenResponse: AccessTokenAction = await AccessToken.create(
    {
      user: createUser._id,
      token: token
    }
  );
  // If something went wrong, return an error
  if (createAccessTokenResponse === null) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // Update the verification token to consumed
  const updateVerificationToken: UpdateResult = await VerificationToken.updateOne(
    { _id: findVerificationToken._id },
    { consumed: true }
  );
  // If something went wrong, return an error
  if (updateVerificationToken.acknowledged === false) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // If all good, return access token
  res.json(new ValidResponse({ accessToken: token }));
}

async function forgotPasswordRequest(req: Request, res: Response) {
  const email: ParamValue = req.body.email;

  // Check if all required values is defined
  if (email === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser: UserAction = await User.findOne(
    {
      email: email
    }
  );
  // If there is no user with that email, return error
  if (findUser === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // Create a verification code
  const code = Math.floor(100000 + Math.random() * 900000);

  // Create a new verification token in the database
  const createVerificationToken: VerificationTokenAction = await VerificationToken.create(
    {
      code: code,
      email: email,
      user: findUser._id
    }
  );
  // If something went wrong, return an error
  if (createVerificationToken === null) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // Send an email to the user with the verification code
  try {
    await sendVerificationToken(VerificationType.ForgotPassword, findUser.name, findUser.email, code);
  } catch {
    res.json(new ErrorResponse(ErrorType.MAIL_ERROR));
    return;
  }

  // If all good, return OK
  res.json(new ValidResponse());
}

async function forgotPasswordConfirmation(req: Request, res: Response) {
  const email: ParamValue = req.body.email;
  const code: ParamValue = req.body.code;

  // Check if all required values is defined
  if (email === undefined || code === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser: UserAction = await User.findOne(
    {
      email: email
    }
  );
  // If there is no user with that email, return error
  if (findUser === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }
  
  // Look for a verification token in the database
  // By user id, verification code and if the token isn't already consumed
  const findVerificationToken: VerificationTokenAction = await VerificationToken.findOne(
    {
      user: findUser._id,
      code: parseInt(code),
      consumed: false
    }
  );
  // If there is no result, return error
  if (findVerificationToken === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // If all good, return OK
  res.json(new ValidResponse());
}

async function forgotPasswordSubmit(req: Request, res: Response) {
  const email: ParamValue = req.body.email;
  const code: ParamValue = req.body.code;
  const password: ParamValue = req.body.password;

  // Check if all required values is defined
  if (email === undefined || code === undefined || password === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser: UserAction = await User.findOne(
    {
      email: email
    }
  );
  // If there is no user with that email, return error
  if (findUser === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // Look for a verification token in the database
  // By user id, verification code and if the token isn't already consumed
  const findVerificationToken: VerificationTokenAction = await VerificationToken.findOne(
    {
      user: findUser._id,
      code: parseInt(code),
      consumed: false
    }
  );
  // If there is no result, return error
  if (findVerificationToken === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // Hash the new password
  const passwordHash: PasswordHash = hashPassword(password);
  if (passwordHash === null) {
    res.json(new ErrorResponse(ErrorType.HASH_PARSING));
    return;
  }

  // Update the user password in the database
  const updateUser: UpdateResult = await User.updateOne(
    { _id: findUser._id },
    { password_hash: passwordHash }
  );
  // If something went wrong, return an error
  if (updateUser.acknowledged === false) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // Update the verification token to consumed
  const updateVerificationToken: UpdateResult = await VerificationToken.updateOne(
    { _id: findVerificationToken._id },
    { consumed: true }
  );
  // If something went wrong, return an error
  if (updateVerificationToken.acknowledged === false) {
    res.json(new ErrorResponse(ErrorType.DATABASE_ERROR));
    return;
  }

  // If all good, return OK
  res.json(new ValidResponse());
}

export default { find, login, logout, signupRequest, signupConfirmation, signupSubmit, forgotPasswordRequest, forgotPasswordConfirmation, forgotPasswordSubmit }