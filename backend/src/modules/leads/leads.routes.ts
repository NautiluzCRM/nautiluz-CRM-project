import { Router } from 'express';
import multer from 'multer';
// Ajuste o caminho do middleware se necessário, baseado na sua estrutura
import { authenticate } from '../../rbac/rbac.middleware.js'; 
import {
  addActivityHandler,
  createLeadHandler,
  deleteLeadHandler,
  getLeadHandler,
  listLeadsHandler,
  updateLeadHandler,
  uploadProposal,   
  downloadProposal  
} from './leads.controller.js';
import { 
  exportXLSXHandler,
  exportCSVHandler,
  exportPDFHandler
} from './export.controller.js';

// Configuração do Multer (Pasta onde os arquivos serão salvos temporariamente)
const upload = multer({ dest: 'uploads/' });

const router = Router();

// Log para confirmar no terminal que este arquivo foi lido pelo servidor
console.log("[LEADS ROUTES] Arquivo de rotas carregado com sucesso!");

// ROTA DE DOWNLOAD (GET) - PÚBLICA / ANTES DA AUTENTICAÇÃO 
// Importante: Está antes do 'authenticate' para permitir que o navegador baixe o arquivo via link direto (<a>) sem precisar de token no header.
router.get('/:id/proposal', downloadProposal);

// LOCO AUTENTICADO (Tudo abaixo exige login)
router.use(authenticate);

// O Express lê de cima para baixo. Mantemos aqui no topo das rotas auth
router.post('/:id/proposal', upload.single('file'), uploadProposal);


// --- Rotas de Exportação ---
router.post('/export/xlsx', exportXLSXHandler);
router.post('/export/csv', exportCSVHandler);
router.post('/export/pdf', exportPDFHandler);

// --- Rotas Gerais (Listagem e Criação) ---
router.get('/', listLeadsHandler);
router.post('/', createLeadHandler);

// --- Rotas Dinâmicas (Genéricas com :id ficam OBRIGATORIAMENTE por último) ---
router.get('/:id', getLeadHandler);
router.patch('/:id', updateLeadHandler);
router.delete('/:id', deleteLeadHandler);
router.post('/:id/activities', addActivityHandler);

export default router;