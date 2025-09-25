import { Request, Response, NextFunction } from 'express';

type Rol = 'Admin' | 'Cajero' | 'Cliente' | 'admin' | 'user'; // admite ambos sets

export function authorizeRoles(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role as Rol | undefined;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: 'Prohibido' });
    }
    next();
  };
}
