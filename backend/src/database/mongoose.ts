import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

mongoose.set('strictQuery', true);

export async function connectMongo() {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME });
  logger.info('Connected to Mongo');
}

export function disconnectMongo() {
  return mongoose.disconnect();
}
