import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt.js';
import { AppError } from '../common/http.js';
import { StatusCodes } from 'http-status-codes';
import { permissions, Role, hasPermission } from './rbac.policies.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Unauthenticated', StatusCodes.UNAUTHORIZED);
  }
  const token = header.slice(7);
  const payload = verifyAccessToken(token);
  (req as any).user = payload;
  next();
}

/**
 * Middleware que verifica se o usuário tem uma permissão específica
 */
export function requirePermission(permission: keyof typeof permissions) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw new AppError('Não autenticado', StatusCodes.UNAUTHORIZED);
    }
    
    const userRole = user.role as Role;
    
    if (!hasPermission(userRole, permission)) {
      throw new AppError(
        `Acesso negado. Você não tem permissão para: ${permission}`,
        StatusCodes.FORBIDDEN
      );
    }
    
    next();
  };
}

/**
 * Middleware que verifica se o usuário tem uma das permissões listadas
 */
export function requireAnyPermission(permissionList: (keyof typeof permissions)[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw new AppError('Não autenticado', StatusCodes.UNAUTHORIZED);
    }
    
    const userRole = user.role as Role;
    const hasAny = permissionList.some(perm => hasPermission(userRole, perm));
    
    if (!hasAny) {
      throw new AppError(
        'Acesso negado. Você não tem as permissões necessárias.',
        StatusCodes.FORBIDDEN
      );
    }
    
    next();
  };
}

/**
 * Middleware que verifica se o usuário tem TODAS as permissões listadas
 */
export function requireAllPermissions(permissionList: (keyof typeof permissions)[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw new AppError('Não autenticado', StatusCodes.UNAUTHORIZED);
    }
    
    const userRole = user.role as Role;
    const hasAll = permissionList.every(perm => hasPermission(userRole, perm));
    
    if (!hasAll) {
      throw new AppError(
        'Acesso negado. Você não tem todas as permissões necessárias.',
        StatusCodes.FORBIDDEN
      );
    }
    
    next();
  };
}

/**
 * Middleware que verifica se o usuário tem um role específico
 */
export function requireRole(requiredRole: Role | Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      throw new AppError('Não autenticado', StatusCodes.UNAUTHORIZED);
    }
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!roles.includes(user.role)) {
      throw new AppError(
        'Acesso negado. Você não tem o perfil necessário.',
        StatusCodes.FORBIDDEN
      );
    }
    
    next();
  };
}
