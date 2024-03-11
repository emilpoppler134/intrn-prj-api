import crypto from 'crypto';

export type IPasswordHash = string | null;

export function hashPassword(password: string): IPasswordHash {
  try {
    return crypto.createHash("sha256")
      .update(password)
      .digest("hex");
  } catch { return null; }
}