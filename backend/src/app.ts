import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { corsOptions } from './config/cors.js';
import { rateLimiter } from './config/rate-limit.js';
import { env } from './config/env.js';
import router from './routes.js';
import { errorHandler } from './middlewares/error.js';
import { requestContext } from './middlewares/request-context.js';
import { attachRealtimeHelpers } from './common/realtime.js';

export const app = express();

// core middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Logs apenas em desenvolvimento
if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(requestContext);

// Rota raiz - Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    name: 'Nautiluz CRM API',
    version: '0.1.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

app.use(router);
app.use(errorHandler);

export const httpServer = createServer(app);
export const io = new SocketIOServer(httpServer, {
  cors: { origin: env.CORS_ORIGIN, credentials: true }
});

attachRealtimeHelpers(io);

io.on('connection', (socket) => {
  socket.on('kanban:join', ({ pipelineId }) => {
    if (pipelineId) socket.join(`pipeline:${pipelineId}`);
  });
});
