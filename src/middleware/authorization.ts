import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config.js";
import { ErrorCode } from "../types/StatusCode.js";
import { TokenPayload } from "../types/TokenPayload.js";

async function authorization(req: Request, res: Response, next: NextFunction) {
  const authorizationHeader = req.headers.authorization;
  const queryToken = req.query.t;
  const token = authorizationHeader
    ? authorizationHeader.replace(/^Bearer\s/, "")
    : queryToken
      ? queryToken.toString()
      : null;

  if (token === null) {
    return res
      .status(ErrorCode.UNAUTHORIZED)
      .send({ message: "No token in authorization header." });
  }

  try {
    const user = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    res.locals.user = user;

    next();
  } catch {
    return res
      .status(ErrorCode.UNAUTHORIZED)
      .send({ message: "Token is not valid." });
  }
}

export default authorization;
