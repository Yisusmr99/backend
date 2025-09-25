// src/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    (req as any).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}
