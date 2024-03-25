import type { Request } from "express";
import type { IUser } from "../models/User";

type TokenPayload = Omit<IUser, 'password_hash' | 'timestamp'>;
type AuthorizedRequest = Request & { user: TokenPayload | undefined };

export type { TokenPayload, AuthorizedRequest }
