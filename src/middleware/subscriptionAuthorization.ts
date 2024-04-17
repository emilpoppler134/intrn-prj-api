import { NextFunction, Request, Response } from "express";
import { ErrorCode } from "../types/StatusCode.js";
import { TokenPayload } from "../types/TokenPayload.js";

async function subscriptionAuthorization(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user: TokenPayload = res.locals.user;

  if (
    user.subscription.status === null ||
    user.subscription.subscription_id === null
  ) {
    return res
      .status(ErrorCode.FORBIDDEN)
      .send({ message: "User don't have a subscription." });
  }

  next();
}

export default subscriptionAuthorization;
