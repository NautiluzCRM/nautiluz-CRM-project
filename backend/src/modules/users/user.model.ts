import mongoose from 'mongoose';

const DistributionConfigSchema = new mongoose.Schema({
  active: { type: Boolean, default: true }, 
  minLives: { type: Number, default: 0 },   
  maxLives: { type: Number, default: 9999 }, 
  cnpjRule: { 
    type: String, 
    enum: ['required', 'forbidden', 'both'], 
    default: 'both' 
  },
  lastLeadReceivedAt: { type: Date, default: null } 
}, { _id: false });

const NotificationPreferencesSchema = new mongoose.Schema({
  email: { type: Boolean, default: true },
  sla: { type: Boolean, default: true },
  sms: { type: Boolean, default: false }
}, { _id: false });

const UserPreferencesSchema = new mongoose.Schema({
  darkMode: { type: Boolean, default: false },
  autoSave: { type: Boolean, default: true }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    
    // A senha já vem criptografada do Service, então aqui é só String normal
    passwordHash: { type: String, required: true, select: false },
    
    role: { 
      type: String, 
      enum: ['admin', 'vendedor', 'gerente'], 
      default: 'vendedor' 
    },
    active: { type: Boolean, default: true },
    
    // Informações de perfil
    phone: { type: String },
    jobTitle: { type: String },
    emailSignature: { type: String },
    photoUrl: { type: String },
    photoBase64: { type: String }, // Mantido para compatibilidade, mas não mais usado
    photoPublicId: { type: String }, // ID da imagem no Cloudinary para deletar
    lastLoginAt: { type: Date },
    
    // Preferências
    notificationPreferences: {
      type: NotificationPreferencesSchema,
      default: () => ({})
    },
    
    preferences: {
      type: UserPreferencesSchema,
      default: () => ({})
    },
    
    //  Configuração de distribuição 
    distribution: { 
      type: DistributionConfigSchema, 
      default: () => ({})
    }
  },
  { timestamps: true }
);


export const UserModel = mongoose.model('User', userSchema);