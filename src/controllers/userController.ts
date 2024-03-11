import crypto from 'crypto';
import { User } from '../models/User.js';
import { ValidResponse, ErrorResponse, EError } from '../lib/Response.js';

import type { Request, Response } from 'express';
import type { IUser } from '../models/User.js';

type IName = string | undefined;
type IEmail = string | undefined;
type IPassword = string | undefined;
type IFindUserResponse = IUser | null;

async function login(req: Request, res: Response) {
  const { email, password }: { email: IEmail, password: IPassword } = req.body;

  if (email === undefined || password === undefined) {
    res.json(new ErrorResponse(EError.INVALID_PARAMS));
    return;
  }

  let passwordHash;

  try {
    passwordHash = crypto.createHash("sha256")
      .update(password)
      .digest("hex");
  } catch {
    res.json(new ErrorResponse(EError.HASH_PARSING));
    return;
  }

  const currentUser: IFindUserResponse = await User.findOne(
    {
      "email": email,
      "password_hash": passwordHash
    }
  );

  if (currentUser === null) {
    res.json(new ErrorResponse(EError.NO_MATCH));
    return;
  }

  res.json(new ValidResponse("This is a token"));
}

export default { login }