import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { 
  findLogoByName, 
  listLogos, 
  upsertLogo, 
  deleteLogo 
} from './operadora-logo.service.js';

/**
 * GET /api/operadoras/logos
 * Lista todas as logos cadastradas
 */
export const listLogosHandler = asyncHandler(async (_req: Request, res: Response) => {
  const logos = await listLogos();
  res.json(logos);
});

/**
 * GET /api/operadoras/logos/search?plano=NomePlano
 * Busca logo por nome do plano/operadora
 */
export const searchLogoHandler = asyncHandler(async (req: Request, res: Response) => {
  const { plano } = req.query;
  
  if (!plano || typeof plano !== 'string') {
    return res.status(400).json({ message: 'Parâmetro "plano" é obrigatório' });
  }
  
  const logo = await findLogoByName(plano);
  
  if (!logo) {
    return res.status(404).json({ message: 'Logo não encontrada' });
  }
  
  res.json(logo);
});

/**
 * POST /api/operadoras/logos
 * Cria ou atualiza logo de uma operadora
 */
export const upsertLogoHandler = asyncHandler(async (req: Request, res: Response) => {
  const { nomeOperadora, imageBase64 } = req.body;
  const currentUser = (req as any).user;
  
  if (!nomeOperadora || !imageBase64) {
    return res.status(400).json({ 
      message: 'Campos "nomeOperadora" e "imageBase64" são obrigatórios' 
    });
  }
  
  // Validação simples de formato
  if (!imageBase64.startsWith('data:image')) {
    return res.status(400).json({ message: 'Formato de imagem inválido' });
  }
  
  // Limite de tamanho (500KB para logos)
  try {
    const content = imageBase64.split(',')[1] || imageBase64;
    const sizeInBytes = (content.length * 3) / 4;
    const maxSize = 500 * 1024; // 500KB
    
    if (sizeInBytes > maxSize) {
      return res.status(400).json({ 
        message: 'A imagem é muito grande. O tamanho máximo permitido é 500KB.' 
      });
    }
  } catch (e) {
    console.warn('Não foi possível calcular o tamanho da imagem');
  }
  
  const userId = currentUser?.sub || currentUser?._id || currentUser?.id;
  
  const logo = await upsertLogo(nomeOperadora, imageBase64, userId);
  
  res.status(201).json({
    message: 'Logo salva com sucesso',
    logo
  });
});

/**
 * DELETE /api/operadoras/logos/:id
 * Remove uma logo
 */
export const deleteLogoHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await deleteLogo(id);
  
  res.json({ message: 'Logo removida com sucesso' });
});
