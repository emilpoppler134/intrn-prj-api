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

export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "";

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const API_ADDRESS = process.env.API_ADDRESS;
export const PORT = parseInt(process.env.PORT || "4000");
