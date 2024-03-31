import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connect } from 'mongoose';

import { PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_NAME } from './config.js';

import './models/Bot.js';
import './models/User.js';
import './models/VerificationToken.js';

import imageRoutes from './routes/images.js';
import botRoutes from './routes/bots.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import subscriptionRoutes from './routes/subscriptions.js';

import { handleWebhook } from './handlers/webhookHandler.js';

const server = express();
server.use(cors());

server.post("/webhook", express.raw({ type: 'application/json' }), handleWebhook)

server.use(bodyParser.json());

server.use("/images", imageRoutes);
server.use("/bots", botRoutes);
server.use("/users", userRoutes);
server.use("/products", productRoutes);
server.use("/subscriptions", subscriptionRoutes);

server.listen(PORT, async () => {
  console.log(`Listening on http://localhost:${PORT}/`);
  await connect(`mongodb+srv://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}/${DATABASE_NAME}`);
});