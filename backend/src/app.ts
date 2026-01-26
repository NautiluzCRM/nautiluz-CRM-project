import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

// Configs
import { corsOptions } from './config/cors.js';
import { rateLimiter } from './config/rate-limit.js';
import { env } from './config/env.js';

// Middlewares e Utils
import { errorHandler } from './middlewares/error.js';
import { requestContext } from './middlewares/request-context.js';
import { attachRealtimeHelpers } from './common/realtime.js';

// Rotas
import router from './routes.js'; // Rotas gerais da API
import { linktreeRouter } from './modules/linktree/linktree.routes.js';
import pipelineRoutes from './routes/Pipeline.routes.js'; // <--- Trazido do index.ts
import leadRoutes from './routes/Lead.routes.js';         // <--- Trazido do index.ts

export const app = express();

// 1. Configurações de Proxy e CORS
app.set('trust proxy', 1);
app.use(cors(corsOptions)); 

// 2. Core Middlewares
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

// Contexto da Requisição
app.use(requestContext);

// 3. Arquivos Estáticos (uploads/exports)
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// 4. Rotas de Health Check
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

// 5. Definição das Rotas da Aplicação

// Rota pública do Linktree
app.use('/public/linktree', linktreeRouter);

// Rotas de Pipeline e Leads (Trazidas do antigo index.ts)
app.use('/pipeline', pipelineRoutes);
app.use('/leads', leadRoutes);

// Rotas Gerais da API (prefixo /api)
app.use('/api', router);

// 6. Tratamento de Erros (Deve ser o último app.use)
app.use(errorHandler);

// 7. Configuração do Servidor HTTP e WebSocket
export const httpServer = createServer(app);
export const io = new SocketIOServer(httpServer, {
  cors: corsOptions
});

// Anexa helpers do Socket.IO (ex: io.emit)
attachRealtimeHelpers(io);

// Eventos do Socket.IO
io.on('connection', (socket) => {
  // console.log(`Socket connected: ${socket.id}`);
  
  socket.on('kanban:join', ({ pipelineId }) => {
    if (pipelineId) socket.join(`pipeline:${pipelineId}`);
  });
});