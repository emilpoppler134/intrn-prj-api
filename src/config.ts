import dotenv from "dotenv";

dotenv.config();

export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "";

export const DATABASE_HOST = process.env.DATABASE_HOST;
export const DATABASE_NAME = process.env.DATABASE_NAME;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
export const DATABASE_USERNAME = process.env.DATABASE_USERNAME;

export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "";
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
export const S3_REGION = process.env.S3_REGION || "";
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const API_ADDRESS = process.env.API_ADDRESS;
export const PORT = parseInt(process.env.PORT || "4000");
