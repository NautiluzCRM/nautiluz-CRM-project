import XLSX from 'xlsx';
import { LeadModel } from '../leads/lead.model.js';
import { env } from '../../config/env.js';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export async function exportLeadsToXlsx(filter: any = {}) {
  const leads = await LeadModel.find(filter).lean<any>();
  const data = leads.map((l: any) => ({
    Nome: l.name,
    Email: l.email,
    Telefone: l.phone,
    Origem: l.origin,
    Pipeline: String(l.pipelineId),
    Etapa: String(l.stageId),
    CriadoEm: l.createdAt,
    AtualizadoEm: l.updatedAt
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
  const filename = `export-${Date.now()}-${randomUUID()}.xlsx`;
  const filepath = path.join(env.UPLOAD_DIR, filename);
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  XLSX.writeFile(workbook, filepath);
  return { url: `/uploads/${filename}`, file: filename };
}
