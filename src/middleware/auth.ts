import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { ErrorResponse } from '../lib/response';
import { ErrorType } from '../types/error';
import type { TokenPayload, AuthorizedRequest } from '../types/authorization';
import { ACCESS_TOKEN_SECRET } from '../config';

async function authorization(req: AuthorizedRequest, res: Response, next: NextFunction) {
  const authorizationHeader = req.headers['authorization'];
  const token = authorizationHeader && authorizationHeader.replace(/^Bearer\s/, '');

  if (token === undefined) {
    return res.json(new ErrorResponse(ErrorType.UNAUTHORIZED));
  }

  try {
    const user = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    req.user = user;

    next();
  } catch {
    return res.json(new ErrorResponse(ErrorType.UNAUTHORIZED));
  }
};

export default authorization;