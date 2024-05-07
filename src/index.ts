import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import mongodb from "mongoose";
import {
  DATABASE_HOST,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_USERNAME,
  PORT,
} from "./config.js";

import "./models/Bot.js";
import "./models/Configuration.js";
import "./models/Language.js";
import "./models/Model.js";
import "./models/Prompt.js";
import "./models/User.js";
import "./models/VerificationToken.js";

import botRoutes from "./routes/bots.js";
import imageRoutes from "./routes/images.js";
import modelRoutes from "./routes/models.js";
import productRoutes from "./routes/products.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import userRoutes from "./routes/users.js";

import { errorHandler } from "./handlers/errorHandler.js";
import { handleWebhook } from "./handlers/webhookHandler.js";

const server = express();

server.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook,
);

server.use(cors());
server.use(bodyParser.json());

server.use("/images", imageRoutes);
server.use("/bots", botRoutes);
server.use("/models", modelRoutes);
server.use("/users", userRoutes);
server.use("/products", productRoutes);
server.use("/subscriptions", subscriptionRoutes);

server.use(errorHandler);

mongodb
  .connect(
    `mongodb+srv://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}/${DATABASE_NAME}`,
  )
  .then(() => {
    console.log("Successfully connected to mongodb.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

server.listen(PORT, async () => {
  console.log(`Listening on http://localhost:${PORT}/`);
});
