import dotenv from 'dotenv';

dotenv.config();

export const DATABASE_HOST = process.env.DATABASE_HOST;
export const DATABASE_NAME = process.env.DATABASE_NAME;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
export const DATABASE_USERNAME = process.env.DATABASE_USERNAME;

export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "";
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
export const S3_REGION = process.env.S3_REGION || "";
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "";

export const CLIENT_ID = process.env.CLIENT_ID;
export const CLIENT_SECRET = process.env.CLIENT_SECRET;
export const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
export const REDIRECT_URI = process.env.REDIRECT_URI;

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

export const PORT = parseInt(process.env.PORT || "4000");
