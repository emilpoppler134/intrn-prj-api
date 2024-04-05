import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { connect } from "mongoose";
import {
  DATABASE_HOST,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_USERNAME,
  PORT,
} from "./config.js";

import "./models/Bot.js";
import "./models/User.js";
import "./models/VerificationToken.js";

import botRoutes from "./routes/bots.js";
import imageRoutes from "./routes/images.js";
import productRoutes from "./routes/products.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import userRoutes from "./routes/users.js";

import { handleWebhook } from "./handlers/webhookHandler.js";

const server = express();
server.use(cors());

server.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook,
);

server.use(bodyParser.json());

server.use("/images", imageRoutes);
server.use("/bots", botRoutes);
server.use("/users", userRoutes);
server.use("/products", productRoutes);
server.use("/subscriptions", subscriptionRoutes);

server.listen(PORT, async () => {
  console.log(`Listening on http://localhost:${PORT}/`);
  await connect(
    `mongodb+srv://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}/${DATABASE_NAME}`,
  );
});
