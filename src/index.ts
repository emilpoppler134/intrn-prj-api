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

const server = express();
server.use(bodyParser.json());
server.use(cors());

server.use("/images", imageRoutes);
server.use("/bots", botRoutes);
server.use("/users", userRoutes);

server.listen(PORT, async () => {
  console.log(`Listening on http://localhost:${PORT}/`);
  await connect(`mongodb+srv://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}/${DATABASE_NAME}`);
});