import crypto from 'crypto';
import { AccessToken } from '../models/AccessToken.js';

import type { IAccessToken } from '../models/AccessToken.js';

type FindAccessToken = IAccessToken | null;

export async function createAccessToken(): Promise<string> {
  while (true) {
    const token = crypto.randomUUID();

    const findAccessToken: FindAccessToken = await AccessToken.findOne(
      {
        token: token
      }
    );

    if (findAccessToken === null) {
      return token;
    }
  }
}