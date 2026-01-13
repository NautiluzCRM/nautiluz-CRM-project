import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Faz upload de uma imagem em Base64 para o Cloudinary
 * @param base64Image - Imagem em formato data:image/xxx;base64,...
 * @param folder - Pasta no Cloudinary (ex: "avatars")
 * @returns URL pública da imagem e publicId
 */
export async function uploadImage(base64Image: string, folder: string = 'avatars'): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `nautiluz-crm/${folder}`,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error: any) {
    console.error('Erro no upload para Cloudinary:', error);
    throw new Error(`Falha no upload da imagem: ${error.message}`);
  }
}

/**
 * Remove uma imagem do Cloudinary pelo publicId
 * @param publicId - ID público da imagem no Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    // Não lança erro para não bloquear outras operações
  }
}

/**
 * Extrai o publicId de uma URL do Cloudinary
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    // URL típica: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/filename.jpg
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const pathWithVersion = parts[1];
    // Remove versão (v123456/) se existir
    const pathWithoutVersion = pathWithVersion.replace(/^v\d+\//, '');
    // Remove extensão
    const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch {
    return null;
  }
}

export default cloudinary;
