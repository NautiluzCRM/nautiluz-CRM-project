import { OperadoraLogoModel } from './operadora-logo.model.js';
import { uploadImage, deleteImage } from '../../services/cloudinary.service.js';

/**
 * Normaliza o nome da operadora para busca
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
    .trim();
}

/**
 * Busca logo de uma operadora pelo nome
 */
export async function findLogoByName(planoNome: string) {
  const normalized = normalizeName(planoNome);
  
  // Busca exata primeiro
  let logo = await OperadoraLogoModel.findOne({ nomeNormalizado: normalized });
  
  if (!logo) {
    // Busca parcial (se o nome contém a operadora)
    logo = await OperadoraLogoModel.findOne({
      nomeNormalizado: { $regex: normalized, $options: 'i' }
    });
  }
  
  if (!logo) {
    // Busca reversa (se a operadora contém parte do nome)
    const allLogos = await OperadoraLogoModel.find();
    logo = allLogos.find(l => normalized.includes(l.nomeNormalizado)) || null;
  }
  
  return logo;
}

/**
 * Lista todas as logos cadastradas
 */
export async function listLogos() {
  return OperadoraLogoModel.find().sort({ nomeOriginal: 1 });
}

/**
 * Cria ou atualiza logo de uma operadora
 */
export async function upsertLogo(
  nomeOperadora: string, 
  imageBase64: string,
  userId?: string
) {
  const normalized = normalizeName(nomeOperadora);
  
  // Verifica se já existe
  const existing = await OperadoraLogoModel.findOne({ nomeNormalizado: normalized });
  
  // Se existe, deleta a imagem antiga do Cloudinary
  if (existing?.logoPublicId) {
    await deleteImage(existing.logoPublicId);
  }
  
  // Faz upload da nova imagem
  const { url, publicId } = await uploadImage(imageBase64, 'operadoras');
  
  // Cria ou atualiza
  const logo = await OperadoraLogoModel.findOneAndUpdate(
    { nomeNormalizado: normalized },
    {
      nomeNormalizado: normalized,
      nomeOriginal: nomeOperadora,
      logoUrl: url,
      logoPublicId: publicId,
      createdBy: userId
    },
    { upsert: true, new: true }
  );
  
  return logo;
}

/**
 * Remove logo de uma operadora
 */
export async function deleteLogo(id: string) {
  const logo = await OperadoraLogoModel.findById(id);
  
  if (!logo) {
    throw new Error('Logo não encontrada');
  }
  
  // Deleta do Cloudinary
  if (logo.logoPublicId) {
    await deleteImage(logo.logoPublicId);
  }
  
  // Remove do banco
  await OperadoraLogoModel.findByIdAndDelete(id);
  
  return { success: true };
}
