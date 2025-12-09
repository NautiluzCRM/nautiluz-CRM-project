export const roles = ['admin', 'financeiro', 'vendedor'] as const;
export type Role = typeof roles[number];

export const permissions = {
  manageUsers: ['admin'],
  managePipelines: ['admin'],
  moveLead: ['admin', 'vendedor', 'financeiro'],
  exportData: ['admin', 'financeiro']
};
