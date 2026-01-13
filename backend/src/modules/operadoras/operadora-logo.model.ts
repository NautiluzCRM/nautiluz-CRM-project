import mongoose from 'mongoose';

const operadoraLogoSchema = new mongoose.Schema(
  {
    // Nome da operadora (normalizado, lowercase, sem acentos)
    nomeNormalizado: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    // Nome original para exibição
    nomeOriginal: { 
      type: String, 
      required: true 
    },
    // URL da imagem no Cloudinary
    logoUrl: { 
      type: String, 
      required: true 
    },
    // ID público no Cloudinary (para deletar)
    logoPublicId: { 
      type: String, 
      required: true 
    },
    // Quem cadastrou
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  },
  { timestamps: true }
);

export const OperadoraLogoModel = mongoose.model('OperadoraLogo', operadoraLogoSchema);
