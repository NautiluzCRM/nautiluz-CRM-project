export const roles = ['admin', 'financeiro', 'vendedor'] as const;
export type Role = typeof roles[number];

/**
 * Permissões detalhadas do sistema CRM Nautiluz
 * 
 * Roles:
 * - admin: Acesso total ao sistema (administrador)
 * - financeiro: Acesso a pipelines, apólices, relatórios financeiros
 * - vendedor: Acesso limitado aos seus próprios leads e atividades
 */
export const permissions = {
  // Gestão de usuários
  manageUsers: ['admin'],
  viewAllUsers: ['admin', 'financeiro'],
  
  // Gestão de Pipelines
  managePipelines: ['admin'],
  viewPipelines: ['admin', 'financeiro', 'vendedor'],
  createPipelineStage: ['admin'],
  editPipelineStage: ['admin'],
  deletePipelineStage: ['admin'],
  
  // Gestão de Leads
  createLead: ['admin', 'financeiro', 'vendedor'],
  viewAllLeads: ['admin', 'financeiro'],
  viewOwnLeads: ['admin', 'financeiro', 'vendedor'],
  editAllLeads: ['admin', 'financeiro'],
  editOwnLeads: ['admin', 'financeiro', 'vendedor'],
  deleteLead: ['admin'],
  moveLead: ['admin', 'vendedor', 'financeiro'],
  assignLead: ['admin', 'financeiro'],
  bulkAssignLeads: ['admin'],
  
  // Apólices
  manageApolices: ['admin', 'financeiro'],
  viewApolices: ['admin', 'financeiro'],
  createApolice: ['admin', 'financeiro'],
  editApolice: ['admin', 'financeiro'],
  deleteApolice: ['admin'],
  viewApoliceAlerts: ['admin', 'financeiro'],
  
  // Anexos e Email
  uploadAttachment: ['admin', 'financeiro', 'vendedor'],
  sendEmail: ['admin', 'financeiro', 'vendedor'],
  sendBulkEmail: ['admin', 'financeiro'],
  viewEmailHistory: ['admin', 'financeiro'],
  
  // Relatórios e Exportação
  exportData: ['admin', 'financeiro'],
  viewReports: ['admin', 'financeiro'],
  viewDashboard: ['admin', 'financeiro', 'vendedor'],
  viewFinancialReports: ['admin', 'financeiro'],
  viewPerformanceReports: ['admin'],
  
  // Configurações
  manageSettings: ['admin'],
  viewSettings: ['admin'],
  
  // Integrações
  manageIntegrations: ['admin'],
  viewIntegrations: ['admin'],
  
  // Auditoria
  viewAuditLogs: ['admin'],
  
  // Alertas
  manageAlerts: ['admin', 'financeiro'],
  viewAlerts: ['admin', 'financeiro', 'vendedor'],
};

/**
 * Verifica se um role tem uma permissão específica
 */
export function hasPermission(role: Role, permission: keyof typeof permissions): boolean {
  const allowedRoles = permissions[permission];
  return allowedRoles.includes(role);
}

/**
 * Retorna todas as permissões de um role
 */
export function getRolePermissions(role: Role): string[] {
  return Object.entries(permissions)
    .filter(([_, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}

/**
 * Descrições dos roles para exibição no frontend
 */
export const roleDescriptions: Record<Role, { label: string; description: string }> = {
  admin: {
    label: 'Administrador',
    description: 'Acesso total ao sistema, gestão de usuários, configurações e todos os recursos'
  },
  financeiro: {
    label: 'Financeiro',
    description: 'Acesso a pipelines, leads, apólices, relatórios financeiros e exportações'
  },
  vendedor: {
    label: 'Vendedor',
    description: 'Acesso aos próprios leads, atividades de vendas e dashboard básico'
  }
};
