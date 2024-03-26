import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { ACCESS_TOKEN_SECRET } from '../config.js';
import { ErrorResponse } from '../lib/response.js';
import { ErrorType } from '../types/Error.js';
import type { TokenPayload } from '../types/TokenPayload';

async function authorization(req: Request, res: Response, next: NextFunction) {
  const authorizationHeader = req.headers['authorization'];
  const token = authorizationHeader && authorizationHeader.replace(/^Bearer\s/, '');

  if (token === undefined) {
    return res.json(new ErrorResponse(ErrorType.UNAUTHORIZED));
  }

  try {
    const user = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    res.locals.user = user;

    next();
  } catch {
    return res.json(new ErrorResponse(ErrorType.UNAUTHORIZED));
  }
};

export default authorization;