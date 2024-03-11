import crypto from 'crypto';
import { User } from '../models/User.js';

import type { IUser } from '../models/User.js';

type IFindTokenResponse = IUser | null;

export async function createToken(): Promise<string> {
  while (true) {
    const token = crypto.randomUUID();

    const findTokenResponse: IFindTokenResponse = await User.findOne(
      {
        "tokens": token
      }
    );

    if (findTokenResponse === null) {
      return token;
    }
  }
}