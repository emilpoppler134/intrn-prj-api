import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import type { DeleteResult, UpdateResult } from 'mongodb';
import type { Request, Response } from 'express';

import { User } from '../models/User.js';
import { VerificationToken } from '../models/VerificationToken.js';
import { hashPassword } from '../lib/hashPassword.js';
import { VerificationType, sendVerificationToken } from '../lib/transmitMail.js';
import { ValidResponse, ErrorResponse } from '../lib/response.js';
import { ErrorType } from '../types/error.js';
import { TokenPayload } from '../types/authorization.js';
import { ACCESS_TOKEN_SECRET } from '../config.js';

type ParamValue = string | undefined;

async function find(req: Request, res: Response) {
  const id: ParamValue = req.body.id;

  // Check if required id value is defined
  if (id === undefined || !Types.ObjectId.isValid(id)) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by id
  const findUser = await User.findOne(
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
  const passwordHash = hashPassword(password);
  if (passwordHash === null) {
    res.json(new ErrorResponse(ErrorType.HASH_PARSING));
    return;
  }

  // Look for the user in the database by email and password
  const findUser = await User.findOne(
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

  const payload = (({ _id, name, email }) => ({ _id, name, email }))(findUser);

  try {
    // Sign a JWT token with user information
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
    // If all good, return JWT token
    res.json(new ValidResponse({ token }));
  } catch {
    res.json(new ErrorResponse(ErrorType.TOKEN_ERROR));
  }
}

async function validateToken(req: Request, res: Response) {
  const authorizationHeader = req.headers['authorization'];
  const token = authorizationHeader && authorizationHeader.replace(/^Bearer\s/, '');

  // Check if token is defined in authorization headers
  if (token === undefined) {
    return res.json(new ErrorResponse(ErrorType.UNAUTHORIZED));
  }

  try {
    // Verify JWT token
    const tokenPayload = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    // If all good, return token payload 
    res.json(new ValidResponse({ tokenPayload }));
  } catch {
    return res.json(new ErrorResponse(ErrorType.UNAUTHORIZED));
  }
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
  const findUser = await User.findOne(
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
  const createVerificationToken = await VerificationToken.create(
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

  const date = new Date();
  date.setHours(date.getHours() + 1);

  // Check if all required values is defined
  if (email === undefined || code === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }
  
  // Look for a verification token in the database 
  // By email, verification code and if the token isn't already consumed
  const findVerificationToken = await VerificationToken.findOne(
    {
      email,
      code: parseInt(code),
      consumed: false,
      expiry_date: {
        $gte: date
      }
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
  const findUser = await User.findOne(
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
  const findVerificationToken = await VerificationToken.findOne(
    {
      email,
      code: parseInt(code),
      consumed: false,
      expiry_date: {
        $gte: new Date()
      }
    }
  );
  // If there is no result, return error
  if (findVerificationToken === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // Hash the password
  const passwordHash = hashPassword(password);
  if (passwordHash === null) {
    res.json(new ErrorResponse(ErrorType.HASH_PARSING));
    return;
  }

  // Create a new user in the database
  const createUser = await User.create(
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

  const payload = (({ _id, name, email }) => ({ _id, name, email }))(createUser);
  let token;

  try {
    // Sign a JWT token with user information
    token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
  } catch {
    res.json(new ErrorResponse(ErrorType.TOKEN_ERROR));
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

  // If all good, return JWT token
  res.json(new ValidResponse({ token: token }));
}

async function forgotPasswordRequest(req: Request, res: Response) {
  const email: ParamValue = req.body.email;

  // Check if all required values is defined
  if (email === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser = await User.findOne(
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
  const createVerificationToken = await VerificationToken.create(
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

  const date = new Date();
  date.setHours(date.getHours() + 1);

  // Check if all required values is defined
  if (email === undefined || code === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser = await User.findOne(
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
  const findVerificationToken = await VerificationToken.findOne(
    {
      user: findUser._id,
      code: parseInt(code),
      consumed: false,
      expiry_date: {
        $gte: date
      }
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

  const date = new Date();
  date.setHours(date.getHours() + 1);

  // Check if all required values is defined
  if (email === undefined || code === undefined || password === undefined) {
    res.json(new ErrorResponse(ErrorType.INVALID_PARAMS));
    return;
  }

  // Look for the user in the database by email
  const findUser = await User.findOne(
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
  const findVerificationToken = await VerificationToken.findOne(
    {
      user: findUser._id,
      code: parseInt(code),
      consumed: false,
      expiry_date: {
        $gte: date
      }
    }
  );
  // If there is no result, return error
  if (findVerificationToken === null) {
    res.json(new ErrorResponse(ErrorType.NO_RESULT));
    return;
  }

  // Hash the new password
  const passwordHash = hashPassword(password);
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

export default { find, login, validateToken, signupRequest, signupConfirmation, signupSubmit, forgotPasswordRequest, forgotPasswordConfirmation, forgotPasswordSubmit }