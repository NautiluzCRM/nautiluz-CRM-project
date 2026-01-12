import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { corsOptions } from './config/cors.js';
import { rateLimiter } from './config/rate-limit.js';
import { env } from './config/env.js';
import router from './routes.js';
import { errorHandler } from './middlewares/error.js';
import { requestContext } from './middlewares/request-context.js';
import { attachRealtimeHelpers } from './common/realtime.js';
import { linktreeRouter } from './modules/linktree/linktree.routes.js';

export const app = express();
app.set('trust proxy', 1);
app.use(cors(corsOptions)); 

// core middlewares
app.use(helmet());
app.use(rateLimiter);

// --- CORREÇÃO: Aumentado para 50mb para evitar erro de Payload Too Large ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// -------------------------------------------------------------------------

app.use(cookieParser());
// Logs apenas em desenvolvimento
if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(requestContext);

// Servir arquivos estáticos (uploads/exports)
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

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

app.use('/public/linktree', linktreeRouter);

app.use('/api', router);
app.use(errorHandler);

export const httpServer = createServer(app);
export const io = new SocketIOServer(httpServer, {
  cors: corsOptions
});

attachRealtimeHelpers(io);

io.on('connection', (socket) => {
  socket.on('kanban:join', ({ pipelineId }) => {
    if (pipelineId) socket.join(`pipeline:${pipelineId}`);
  });
});