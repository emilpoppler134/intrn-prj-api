import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connect } from 'mongoose';

import { PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_NAME } from './config.js';

import imageRoutes from './routes/images.js';

const server = express();
server.use(bodyParser.json())
server.use(cors());

server.use("/images", imageRoutes);

server.listen(PORT, async () => {
  console.log(`Listening on http://localhost:${PORT}/`);
  await connect(`mongodb+srv://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}/${DATABASE_NAME}`);
});