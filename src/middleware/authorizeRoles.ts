import { Request, Response, NextFunction } from 'express';
import { error as errorResponse } from '../utils/response.util';

type Rol = 'Admin' | 'Cajero' | 'Cliente' | 'admin' | 'user';

export function authorizeRoles(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role as Rol | undefined;

    if (!role) {
      return errorResponse(res, 'No autorizado', 401);
    }

    if (!roles.includes(role)) {
      return errorResponse(res, 'Prohibido: privilegios insuficientes', 403);
    }

    return next();
  };
}
