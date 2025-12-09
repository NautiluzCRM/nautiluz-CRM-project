export const roles = ['admin', 'financeiro', 'vendedor'];
export const permissions = {
    manageUsers: ['admin'],
    managePipelines: ['admin'],
    moveLead: ['admin', 'vendedor', 'financeiro'],
    exportData: ['admin', 'financeiro']
};
