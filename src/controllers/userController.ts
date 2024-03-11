import { User } from '../models/User.js';
import { ValidResponse, ErrorResponse, EError } from '../lib/Response.js';
import { hashPassword } from '../lib/hashPassword.js';

import type { Request, Response } from 'express';
import type { IUser } from '../models/User.js';
import type { IPasswordHash } from '../lib/hashPassword.js';

type IName = string | undefined;
type IEmail = string | undefined;
type IPassword = string | undefined;

type IFindUserResponse = IUser | null;
type ICreateUserResponse = IUser | null;

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
    res.json(new ErrorResponse(EError.NO_MATCH));
    return;
  }

  res.json(new ValidResponse("This is a token"));
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

  const createUserResponse: ICreateUserResponse = await User.create(
    {
      "name": name,
      "email": email,
      "password_hash": passwordHash
    }
  );

  if (createUserResponse === null) {
    res.json(new ErrorResponse(EError.DATABASE_ERROR));
    return;
  }

  res.json(createUserResponse);
}

export default { login, signup }