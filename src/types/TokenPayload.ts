import { IUser } from "../models/User.js";

export type TokenPayload = Omit<IUser, "password_hash" | "timestamp">;
