/**
 * Script para analisar e gerar documentação do schema MongoDB
 * Execução: node scripts/analyze-schema.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar todos os modelos
import { UserModel } from '../src/modules/users/user.model.js';
import { LeadModel } from '../src/modules/leads/lead.model.js';
import { PipelineModel } from '../src/modules/pipelines/pipeline.model.js';
import { StageModel } from '../src/modules/pipelines/stage.model.js';
import { ActivityModel } from '../src/modules/leads/activity.model.js';
import { AttachmentModel } from '../src/modules/leads/attachments.model.js';
import { ApoliceModel } from '../src/modules/apolices/apolice.model.js';
import { AlertModel } from '../src/modules/alerts/alert.model.js';
import { AuditModel } from '../src/modules/audit/audit.model.js';
import { EmailModel } from '../src/modules/emails/email.model.js';
import { IntegrationModel } from '../src/modules/integrations/integration.model.js';
import { ConsentModel } from '../src/modules/lgpd/consent.model.js';
import { ViewModel } from '../src/modules/filters/view.model.js';
import { Note } from '../src/models/Note.model.js';
import { Notification } from '../src/models/Notification.model.js';
import { PasswordResetModel } from '../src/auth/password-reset.model.js';

const models = {
  User: UserModel,
  Lead: LeadModel,
  Pipeline: PipelineModel,
  Stage: StageModel,
  Activity: ActivityModel,
  Attachment: AttachmentModel,
  Apolice: ApoliceModel,
  Alert: AlertModel,
  Audit: AuditModel,
  Email: EmailModel,
  Integration: IntegrationModel,
  Consent: ConsentModel,
  View: ViewModel,
  Note: Note,
  Notification: Notification,
  PasswordReset: PasswordResetModel
};

/**
 * Extrai informações do schema Mongoose
 */
function extractSchemaInfo(model) {
  const schema = model.schema;
  const paths = schema.paths;
  const indexes = schema.indexes();
  
  const fields = {};
  
  // Extrair campos
  Object.keys(paths).forEach(key => {
    if (key === '_id' || key === '__v') return;
    
    const path = paths[key];
    const options = path.options || {};
    
    fields[key] = {
      type: path.instance,
      required: options.required || false,
      unique: options.unique || false,
      default: options.default !== undefined,
      ref: options.ref || null,
      enum: options.enum || null,
      index: options.index || false
    };
  });
  
  return {
    collectionName: model.collection.name,
    fields,
    indexes: indexes.map(idx => ({
      fields: idx[0],
      options: idx[1] || {}
    }))
  };
}

/**
 * Gera markdown com a documentação
 */
function generateMarkdown() {
  let markdown = '# Schema MongoDB - Análise Automática\n\n';
  markdown += `**Gerado em:** ${new Date().toLocaleString('pt-BR')}\n\n`;
  markdown += `**Total de Collections:** ${Object.keys(models).length}\n\n`;
  markdown += '---\n\n';
  
  Object.entries(models).forEach(([name, model]) => {
    const info = extractSchemaInfo(model);
    
    markdown += `## ${name}\n\n`;
    markdown += `**Collection:** \`${info.collectionName}\`\n\n`;
    
    // Campos
    markdown += '### Campos\n\n';
    markdown += '| Campo | Tipo | Required | Unique | Ref | Enum |\n';
    markdown += '|-------|------|----------|--------|-----|------|\n';
    
    Object.entries(info.fields).forEach(([fieldName, field]) => {
      const req = field.required ? '✅' : '';
      const uniq = field.unique ? '✅' : '';
      const ref = field.ref || '';
      const enm = field.enum ? `[${field.enum.length}]` : '';
      
      markdown += `| ${fieldName} | ${field.type} | ${req} | ${uniq} | ${ref} | ${enm} |\n`;
    });
    
    markdown += '\n';
    
    // Índices
    if (info.indexes.length > 0) {
      markdown += '### Índices\n\n';
      info.indexes.forEach((idx, i) => {
        const fields = Object.entries(idx.fields).map(([k, v]) => `${k}: ${v}`).join(', ');
        const options = Object.keys(idx.options).length > 0 ? 
          ` (${JSON.stringify(idx.options)})` : '';
        markdown += `${i + 1}. \`{${fields}}${options}\`\n`;
      });
      markdown += '\n';
    }
    
    markdown += '---\n\n';
  });
  
  return markdown;
}

/**
 * Gera diagrama PlantUML
 */
function generatePlantUML() {
  let puml = '@startuml schema-mongodb\n\n';
  puml += '!define TABLE(x) entity x << (T,#FFAAAA) >>\n';
  puml += '!define PK(x) <u>x</u>\n';
  puml += '!define FK(x) <i>x</i>\n\n';
  
  // Entidades
  Object.entries(models).forEach(([name, model]) => {
    const info = extractSchemaInfo(model);
    
    puml += `TABLE(${name}) {\n`;
    puml += '  PK(_id) : ObjectId\n';
    puml += '  --\n';
    
    Object.entries(info.fields).forEach(([fieldName, field]) => {
      const prefix = field.ref ? 'FK' : '';
      const suffix = field.unique ? ' <<unique>>' : '';
      const type = field.ref ? 'ObjectId' : field.type;
      
      if (prefix) {
        puml += `  ${prefix}(${fieldName}) : ${type}${suffix}\n`;
      } else {
        puml += `  ${fieldName} : ${type}${suffix}\n`;
      }
    });
    
    puml += '}\n\n';
  });
  
  // Relacionamentos (simplificado - detectar refs)
  puml += '\' Relacionamentos\n';
  Object.entries(models).forEach(([name, model]) => {
    const info = extractSchemaInfo(model);
    
    Object.entries(info.fields).forEach(([fieldName, field]) => {
      if (field.ref && models[field.ref]) {
        puml += `${field.ref} ||--o{ ${name} : "${fieldName}"\n`;
      }
    });
  });
  
  puml += '\n@enduml';
  
  return puml;
}

/**
 * Gera JSON com todos os dados
 */
function generateJSON() {
  const result = {};
  
  Object.entries(models).forEach(([name, model]) => {
    result[name] = extractSchemaInfo(model);
  });
  
  return JSON.stringify(result, null, 2);
}

/**
 * Função principal
 */
async function main() {
  console.log('🔍 Analisando schemas Mongoose...\n');
  
  const outputDir = path.join(__dirname, '../../documentação/schema-analysis');
  
  // Criar diretório se não existir
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Gerar arquivos
  console.log('📝 Gerando Markdown...');
  const markdown = generateMarkdown();
  fs.writeFileSync(path.join(outputDir, 'schema-analysis.md'), markdown);
  console.log('✅ Criado: schema-analysis.md');
  
  console.log('📊 Gerando PlantUML...');
  const plantuml = generatePlantUML();
  fs.writeFileSync(path.join(outputDir, 'schema-diagram.puml'), plantuml);
  console.log('✅ Criado: schema-diagram.puml');
  
  console.log('📦 Gerando JSON...');
  const json = generateJSON();
  fs.writeFileSync(path.join(outputDir, 'schema-data.json'), json);
  console.log('✅ Criado: schema-data.json');
  
  console.log('\n✨ Análise completa!');
  console.log(`📁 Arquivos salvos em: ${outputDir}\n`);
  
  process.exit(0);
}

// Executar
main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
