import { CorsOptions } from 'cors';
import { env } from './env.js';

export const corsOptions: CorsOptions = {
  origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true
};
