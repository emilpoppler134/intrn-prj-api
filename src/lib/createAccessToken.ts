import crypto from 'crypto';
import { AccessToken } from '../models/AccessToken.js';

import type { IAccessToken } from '../models/AccessToken.js';

type IFindAccessToken = IAccessToken | null;

export async function createAccessToken(): Promise<string> {
  while (true) {
    const token = crypto.randomUUID();

    const findAccessToken: IFindAccessToken = await AccessToken.findOne(
      {
        token: token
      }
    );

    if (findAccessToken === null) {
      return token;
    }
  }
}