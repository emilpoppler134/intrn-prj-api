import crypto from 'crypto';

export type PasswordHash = string | null;

export function hashPassword(password: string): PasswordHash {
  try {
    return crypto.createHash("sha256")
      .update(password)
      .digest("hex");
  } catch { return null; }
}