import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import { exportToXLSX, exportToCSV, exportToPDF } from './export.service.js';

// Schema para validação de filtros e campos
const exportSchema = z.object({
  filters: z.object({
    stageId: z.string().optional(),
    origin: z.string().optional(),
    owners: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    pipelineId: z.string().optional(),
  }).optional(),
  fields: z.object({
    basico: z.boolean().optional().default(true),
    contato: z.boolean().optional().default(true),
    cnpj: z.boolean().optional().default(true),
    vidas: z.boolean().optional().default(true),
    hospitais: z.boolean().optional().default(true),
    responsaveis: z.boolean().optional().default(true),
    observacoes: z.boolean().optional().default(true),
  }).optional(),
});

export const exportXLSXHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = exportSchema.parse(req.body);
  const filters = body.filters || {};
  const fields = body.fields || {
    basico: true,
    contato: true,
    cnpj: true,
    vidas: true,
    hospitais: true,
    responsaveis: true,
    observacoes: true,
  };

  const buffer = await exportToXLSX(filters, fields);
  
  const dataHoje = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Leads_Nautiluz_${dataHoje}.xlsx"`);
  res.send(buffer);
});

export const exportCSVHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = exportSchema.parse(req.body);
  const filters = body.filters || {};
  const fields = body.fields || {
    basico: true,
    contato: true,
    cnpj: true,
    vidas: true,
    hospitais: true,
    responsaveis: true,
    observacoes: true,
  };

  const csv = await exportToCSV(filters, fields);
  
  const dataHoje = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Leads_Nautiluz_${dataHoje}.csv"`);
  res.send(csv);
});

export const exportPDFHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = exportSchema.parse(req.body);
  const filters = body.filters || {};
  const fields = body.fields || {
    basico: true,
    contato: true,
    cnpj: true,
    vidas: true,
    hospitais: true,
    responsaveis: true,
    observacoes: true,
  };

  const buffer = await exportToPDF(filters, fields);
  
  const dataHoje = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Leads_Nautiluz_${dataHoje}.pdf"`);
  res.send(buffer);
});
