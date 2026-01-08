import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIntegration extends Document {
  _id: Types.ObjectId;
  type: 'meta_lead_ads' | 'google_ads' | 'webhook_generico';
  name: string;
  active: boolean;
  config: {
    // Meta Lead Ads - Credenciais
    appId?: string;
    appSecret?: string;
    accessToken?: string;
    
    // Meta Lead Ads - IDs
    pageId?: string;
    formId?: string;
    adAccountId?: string;
    campaignId?: string;
    verifyToken?: string;
    
    // Mapeamento de campos do formulário Lead Ads
    fieldMapping?: {
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      city?: string;
      state?: string;
      job_title?: string;
      [key: string]: string | undefined;
    };
    
    // Configuração de destino no CRM
    defaultPipelineId?: Types.ObjectId;
    defaultStageId?: Types.ObjectId;
    defaultOwnerId?: Types.ObjectId;
    origin?: string;
    
    // Configurações extras
    autoReply?: boolean;
    autoReplyMessage?: string;
    
    // Webhook genérico
    webhookUrl?: string;
    webhookSecret?: string;
  };
  
  // Estatísticas
  stats: {
    leadsReceived: number;
    leadsCreated: number;
    lastLeadAt?: Date;
    errors: number;
  };
  
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    type: {
      type: String,
      enum: ['meta_lead_ads', 'google_ads', 'webhook_generico'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    config: {
      // Credenciais
      appId: String,
      appSecret: String,
      accessToken: String,
      
      // IDs
      pageId: String,
      formId: String,
      adAccountId: String,
      campaignId: String,
      verifyToken: String,
      
      // Mapeamento de campos
      fieldMapping: {
        type: Schema.Types.Mixed,
        default: {
          name: 'full_name',
          email: 'email',
          phone: 'phone_number',
          company: 'company_name',
          city: 'city',
          state: 'state'
        }
      },
      
      // Destino
      defaultPipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline' },
      defaultStageId: { type: Schema.Types.ObjectId, ref: 'Stage' },
      defaultOwnerId: { type: Schema.Types.ObjectId, ref: 'User' },
      origin: { type: String, default: 'Instagram Lead Ads' },
      
      // Extras
      autoReply: { type: Boolean, default: false },
      autoReplyMessage: String,
      
      // Webhook genérico
      webhookUrl: String,
      webhookSecret: String
    },
    stats: {
      leadsReceived: { type: Number, default: 0 },
      leadsCreated: { type: Number, default: 0 },
      lastLeadAt: Date,
      errors: { type: Number, default: 0 }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// Índices
IntegrationSchema.index({ type: 1, active: 1 });
IntegrationSchema.index({ 'config.pageId': 1 });
IntegrationSchema.index({ 'config.verifyToken': 1 });

export const IntegrationModel = mongoose.model<IIntegration>('Integration', IntegrationSchema);
