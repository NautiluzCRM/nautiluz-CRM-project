import { LeadModel } from './lead.model.js';
import { UserModel } from '../users/user.model.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

interface ExportFilters {
  stageId?: string;
  origin?: string;
  owners?: string[];
  startDate?: string;
  endDate?: string;
  pipelineId?: string;
}

interface ExportFields {
  basico: boolean;
  contato: boolean;
  cnpj: boolean;
  vidas: boolean;
  hospitais: boolean;
  responsaveis: boolean;
  observacoes: boolean;
}

const LABELS_FAIXAS = [
  "Vidas 0 a 18", "Vidas 19 a 23", "Vidas 24 a 28", "Vidas 29 a 33", "Vidas 34 a 38",
  "Vidas 39 a 43", "Vidas 44 a 48", "Vidas 49 a 53", "Vidas 54 a 58", "Vidas 59 ou mais"
];

// Construir query de filtros
function buildFilterQuery(filters: ExportFilters) {
  const query: any = {};

  if (filters.stageId) {
    query.stageId = filters.stageId;
  }

  if (filters.origin && filters.origin !== '') {
    query.origin = filters.origin;
  }

  if (filters.owners && filters.owners.length > 0) {
    query.owners = { $in: filters.owners };
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt.$lte = endDate;
    }
  }

  if (filters.pipelineId) {
    query.pipelineId = filters.pipelineId;
  }

  return query;
}

// Mapear estágios
async function getStageMap() {
  const stages = await StageModel.find({});
  const stageMap: Record<string, string> = {};
  
  stages.forEach((stage: any) => {
    const id = stage._id.toString();
    const nome = stage.name || stage.nome;
    if (id && nome) {
      stageMap[id] = nome;
    }
  });

  return stageMap;
}

// Mapear usuários
async function getUserMap() {
  const users = await UserModel.find({});
  const userMap: Record<string, string> = {};
  
  users.forEach((user: any) => {
    const id = user._id.toString();
    const nome = user.nome || user.name;
    if (id && nome) {
      userMap[id] = nome;
    }
  });

  return userMap;
}

// Formatar dados para exportação
async function formatExportData(leads: any[], fields: ExportFields) {
  const stageMap = await getStageMap();
  const userMap = await getUserMap();

  return leads.map((lead: any) => {
    let obj: any = {};

    // Dados Básicos
    if (fields.basico) {
      obj["ID do Sistema"] = lead._id?.toString() || lead.id;
      obj["Nome do Lead"] = lead.name || "--";
      obj["Empresa"] = lead.company || "";
      obj["Origem"] = lead.origin || "";
      obj["Data de Entrada"] = lead.createdAt 
        ? new Date(lead.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) 
        : "";
      obj["Última Atualização"] = lead.updatedAt
        ? new Date(lead.updatedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : "";
    }

    // Dados de Contato
    if (fields.contato) {
      obj["E-mail"] = lead.email || "";
      obj["Celular"] = lead.phone || "";
      obj["Cidade"] = lead.city || "";
      obj["UF"] = lead.state || "";
    }

    // Dados CNPJ
    if (fields.cnpj) {
      obj["Possui CNPJ?"] = lead.hasCnpj ? "Sim" : "Não";
      obj["CNPJ"] = lead.cnpj || "";
      obj["Tipo CNPJ"] = lead.cnpjType || "";
      obj["Já tem Plano?"] = lead.hasCurrentPlan ? "Sim" : "Não";
      obj["Plano Atual"] = lead.currentOperadora || lead.currentPlan || "";
    }

    // Dados de Vidas
    if (fields.vidas) {
      obj["Total de Vidas"] = Number(lead.livesCount) || 0;
      obj["Valor Médio (R$)"] = Number(lead.avgPrice) || 0;
      
      // Mapeamento das chaves do objeto novo para bater com a ordem de LABELS_FAIXAS
      const keysFaixas = [
        'ate18', 'de19a23', 'de24a28', 'de29a33', 'de34a38',
        'de39a43', 'de44a48', 'de49a53', 'de54a58', 'acima59'
      ];

      LABELS_FAIXAS.forEach((label, index) => {
        const key = keysFaixas[index];
        
        let valor = lead.faixasEtarias?.[key];

        if (valor === undefined || valor === null) {
           const legacyArray = Array.isArray(lead.ageBuckets) ? lead.ageBuckets : (Array.isArray(lead.idades) ? lead.idades : []);
           valor = legacyArray[index];
        }

        obj[label] = Number(valor) || 0;
      });
    }

    // Hospitais
    if (fields.hospitais) {
      const hospitais = Array.isArray(lead.preferredHospitals) 
        ? lead.preferredHospitals.join(", ") 
        : "";
      obj["Hospitais Preferência"] = hospitais;
    }

    // Responsáveis
    if (fields.responsaveis) {
      let responsaveis = "";
      if (Array.isArray(lead.owners) && lead.owners.length > 0) {
        responsaveis = lead.owners
          .map((ownerId: any) => {
            const id = typeof ownerId === 'string' ? ownerId : ownerId._id?.toString();
            return userMap[id] || "";
          })
          .filter(Boolean)
          .join(", ");
      }
      
      obj["Responsáveis"] = responsaveis;
      
      const stageId = lead.stageId?.toString() || lead.stageId;
      obj["Etapa Atual"] = stageMap[stageId] || "Desconhecida";
      obj["Status Qualificação"] = lead.qualificationStatus || "";
      obj["Motivo Perda"] = lead.lostReason || "";
    }

    // Observações
    if (fields.observacoes) {
      obj["Observações"] = lead.notes || "";
    }

    return obj;
  });
}

// Exportar para XLSX
export async function exportToXLSX(
  filters: ExportFilters, 
  fields: ExportFields
): Promise<Buffer> {
  const query = buildFilterQuery(filters);
  const leads = await LeadModel.find(query)
    .populate('owners', 'name email')
    .exec();

  if (leads.length === 0) {
    throw new Error("Nenhum lead encontrado com os filtros selecionados.");
  }

  const data = await formatExportData(leads, fields);

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  const wscols = [
    { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
    { wch: 15 }, { wch: 5 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 10 },
    { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 20 },
    { wch: 15 }, { wch: 20 }, { wch: 50 }
  ];
  worksheet['!cols'] = wscols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Exportados");

  return XLSX.write(workbook, { type: 'buffer' });
}

// Exportar para CSV
export async function exportToCSV(
  filters: ExportFilters, 
  fields: ExportFields
): Promise<string> {
  const query = buildFilterQuery(filters);
  const leads = await LeadModel.find(query)
    .populate('owners', 'name email')
    .exec();

  if (leads.length === 0) {
    throw new Error("Nenhum lead encontrado com os filtros selecionados.");
  }

  const data = await formatExportData(leads, fields);

  const worksheet = XLSX.utils.json_to_sheet(data);
  return XLSX.utils.sheet_to_csv(worksheet);
}

// Exportar para PDF usando pdfkit
export async function exportToPDF(
  filters: ExportFilters, 
  fields: ExportFields
): Promise<Buffer> {
  const query = buildFilterQuery(filters);
  const leads = await LeadModel.find(query)
    .populate('owners', 'name email')
    .exec();

  if (leads.length === 0) {
    throw new Error("Nenhum lead encontrado com os filtros selecionados.");
  }

  const data = await formatExportData(leads, fields);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      bufferPages: true,
      autoFirstPage: true
    });
    
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      const dataHoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const horaHoje = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // ============ CABEÇALHO COMPACTO ============
      doc.moveTo(40, 40)
         .lineTo(pageWidth - 40, 40)
         .strokeColor('#e0e0e0')
         .lineWidth(1)
         .stroke();

      // Logo e título na mesma linha
      doc.fontSize(32)
         .fillColor('#1a1a1a')
         .font('Helvetica-Bold')
         .text('N', 40, 50);
      
      doc.fontSize(20)
         .fillColor('#1a1a1a')
         .font('Helvetica-Bold')
         .text('Relatorio de Leads', 85, 55);
      
      // Data no canto direito
      doc.fontSize(8)
         .fillColor('#999999')
         .font('Helvetica')
         .text(`${dataHoje} ${horaHoje}`, pageWidth - 120, 60, { width: 80, align: 'right' });

      doc.moveTo(40, 90)
         .lineTo(pageWidth - 40, 90)
         .strokeColor('#e0e0e0')
         .lineWidth(1)
         .stroke();

      let currentY = 105;

      // ============ MÉTRICAS COMPACTAS ============
      const cardWidth = 160;
      const cardHeight = 50;
      
      // Total de Leads
      doc.rect(40, currentY, cardWidth, cardHeight)
         .fillAndStroke('#f8f9fa', '#e0e0e0')
         .lineWidth(0.5);
      
      doc.fontSize(8)
         .fillColor('#666666')
         .font('Helvetica')
         .text('TOTAL', 50, currentY + 12);
      
      doc.fontSize(24)
         .fillColor('#1a1a1a')
         .font('Helvetica-Bold')
         .text(data.length.toString(), 50, currentY + 23);

      // Data
      doc.rect(220, currentY, cardWidth, cardHeight)
         .fillAndStroke('#f8f9fa', '#e0e0e0')
         .lineWidth(0.5);
      
      doc.fontSize(8)
         .fillColor('#666666')
         .font('Helvetica')
         .text('DATA', 230, currentY + 12);
      
      doc.fontSize(13)
         .fillColor('#1a1a1a')
         .font('Helvetica')
         .text(dataHoje, 230, currentY + 27);

      // Filtros
      doc.rect(400, currentY, cardWidth, cardHeight)
         .fillAndStroke('#f8f9fa', '#e0e0e0')
         .lineWidth(0.5);
      
      doc.fontSize(8)
         .fillColor('#666666')
         .font('Helvetica')
         .text('FILTROS', 410, currentY + 12);

      const filtrosAplicados = [];
      if (filters.origin) filtrosAplicados.push(filters.origin);
      if (filters.stageId) filtrosAplicados.push(filters.stageId);
      
      const filtrosTexto = filtrosAplicados.length > 0 
        ? filtrosAplicados.join(', ').substring(0, 20)
        : 'Nenhum';
      
      doc.fontSize(10)
         .fillColor('#1a1a1a')
         .font('Helvetica')
         .text(filtrosTexto, 410, currentY + 27, { width: cardWidth - 20, ellipsis: true });

      currentY += 70;

      // ============ TABELA DE DADOS MINIMALISTA ============
      if (data.length > 0) {
        const tableData = data.map(row => ({
          'Nome do Lead': row['Nome do Lead'] || '',
          'Celular': row['Celular'] || '',
          'Cidade-UF': `${row['Cidade'] || ''}-${row['UF'] || ''}`.replace(/^-|-$/g, ''),
          'Origem': row['Origem'] || ''
        }));

        const columns = ['Nome do Lead', 'Celular', 'Cidade-UF', 'Origem'];
        const tableWidth = pageWidth - 100;
        const colWidths = [
          tableWidth * 0.35, // Nome - 35%
          tableWidth * 0.25, // Celular - 25%
          tableWidth * 0.20, // Cidade - 20%
          tableWidth * 0.20  // Origem - 20%
        ];
        
        // Cabeçalho da tabela minimalista
        let xPos = 50;
        columns.forEach((col, i) => {
          doc.fontSize(8)
             .fillColor('#666666')
             .font('Helvetica-Bold')
             .text(col.toUpperCase(), xPos, currentY, {
               width: colWidths[i] - 10,
               align: 'left'
             });
          xPos += colWidths[i];
        });
        
        currentY += 20;

        // Linha abaixo do cabeçalho
        doc.moveTo(50, currentY)
           .lineTo(pageWidth - 50, currentY)
           .strokeColor('#e0e0e0')
           .lineWidth(1)
           .stroke();
        
        currentY += 15;

        // Linhas da tabela
        tableData.forEach((row, rowIndex) => {
          // Verificar se precisa de nova página
          if (currentY > pageHeight - 120) {
            doc.addPage();
            currentY = 50;
            
            // Re-desenhar cabeçalho da tabela na nova página
            xPos = 50;
            columns.forEach((col, i) => {
              doc.fontSize(8)
                 .fillColor('#666666')
                 .font('Helvetica-Bold')
                 .text(col.toUpperCase(), xPos, currentY, {
                   width: colWidths[i] - 10,
                   align: 'left'
                 });
              xPos += colWidths[i];
            });
            
            currentY += 20;
            doc.moveTo(50, currentY)
               .lineTo(pageWidth - 50, currentY)
               .strokeColor('#e0e0e0')
               .lineWidth(1)
               .stroke();
            currentY += 15;
          }

          // Dados da linha
          xPos = 50;
          columns.forEach((col, i) => {
            const value = String(row[col as keyof typeof row] || '')
              .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, '')
              .substring(0, 35);
            
            doc.fontSize(8)
               .fillColor('#1a1a1a')
               .font('Helvetica')
               .text(value, xPos, currentY, {
                 width: colWidths[i] - 10,
                 align: 'left',
                 ellipsis: true
               });
            xPos += colWidths[i];
          });
          
          currentY += 17;

          // Linha sutil entre registros (a cada 5 linhas)
          if ((rowIndex + 1) % 5 === 0) {
            doc.moveTo(50, currentY - 2)
               .lineTo(pageWidth - 50, currentY - 2)
               .strokeColor('#f0f0f0')
               .lineWidth(0.5)
               .stroke();
          }
        });

        // Total de registros
        if (data.length > 0) {
          currentY += 15;
          doc.moveTo(50, currentY)
             .lineTo(pageWidth - 50, currentY)
             .strokeColor('#e0e0e0')
             .lineWidth(1)
             .stroke();
          
          currentY += 20;
          doc.fontSize(9)
             .fillColor('#666666')
             .font('Helvetica')
             .text(`${data.length} ${data.length === 1 ? 'registro' : 'registros'} encontrado${data.length === 1 ? '' : 's'}`, 50, currentY, {
               width: tableWidth,
               align: 'right'
             });
        }
      }

      // ============ RODAPÉ MINIMALISTA ============
      const footerY = pageHeight - 60;
      
      // Linha superior do rodapé
      doc.moveTo(50, footerY)
         .lineTo(pageWidth - 50, footerY)
         .strokeColor('#e0e0e0')
         .lineWidth(1)
         .stroke();

      doc.fontSize(8)
         .fillColor('#999999')
         .font('Helvetica')
         .text(
           `Nautiluz CRM  |  ${new Date().getFullYear()}`,
           50,
           footerY + 15,
           { width: pageWidth - 100, align: 'center' }
         );
      
      doc.fontSize(7)
         .fillColor('#bbbbbb')
         .text(
           'Para exportar com todos os campos, utilize Excel ou CSV',
           50,
           footerY + 30,
           { width: pageWidth - 100, align: 'center' }
         );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
