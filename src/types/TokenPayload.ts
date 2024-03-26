import type { IUser } from "../models/User";

type TokenPayload = Omit<IUser, 'password_hash' | 'timestamp'>;

export type { TokenPayload }
