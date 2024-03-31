import { Request, Response, NextFunction } from 'express';

import { ErrorResponse } from '../lib/response.js';
import { ErrorType } from '../types/Error.js';
import { TokenPayload } from '../types/TokenPayload.js';

async function subscriptionAuthorization(req: Request, res: Response, next: NextFunction) {
  const user: TokenPayload = res.locals.user;

  if (user.subscription.status === null || user.subscription.subscription_id === null) {
    return res.json(new ErrorResponse(ErrorType.NO_SUBSCRIPTION));
  }

  next();
}

export default subscriptionAuthorization;
