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

// Rotas Gerais
import router from './routes.js'; 
import { linktreeRouter } from './modules/linktree/linktree.routes.js';

// Rotas Específicas
import pipelineRoutes from './routes/Pipeline.routes.js'; 
// 👇 Importando do local correto onde editamos o arquivo de rotas
import leadRoutes from './modules/leads/leads.routes.js'; 

export const app = express();

// 1. Configurações de Proxy e CORS
app.set('trust proxy', 1);
app.use(cors(corsOptions)); 

// 2. Core Middlewares
app.use(helmet());
app.use(rateLimiter);

// --- Aumentado para 50mb para permitir upload de arquivos grandes ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cookieParser());

// Logs apenas em desenvolvimento
if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Contexto da Requisição
app.use(requestContext);

// 3. Arquivos Estáticos (uploads/exports)
// Garante que a pasta 'uploads' seja acessível publicamente (necessário para ver o PDF depois)
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR || 'uploads')));

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

// =======================================================================
// 🚨 DEFINIÇÃO DE ROTAS CORRIGIDA 🚨
// Agora o backend serve em /api/leads para casar com o frontend
// =======================================================================
app.use('/api/pipeline', pipelineRoutes); 
app.use('/api/leads', leadRoutes);        
// =======================================================================

// Rotas Gerais da API (prefixo /api)
// Importante ficar por último para não sobrescrever as rotas específicas acima
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

// Função de diagnóstico de rotas (Opcional - ajuda a ver se carregou)
setTimeout(() => {
  console.log('\n✅ [SERVER] Servidor iniciado. Rotas de Leads configuradas em: /api/leads');
}, 1000);