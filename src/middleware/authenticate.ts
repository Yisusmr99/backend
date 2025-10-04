import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';
import { error as errorResponse } from '../utils/response.util';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return errorResponse(res, 'No autorizado: token ausente o mal formado', 401);
    }

    const payload = verifyAccessToken(token);
    // sub puede venir como string o number
    const sub: string | number = (payload as any).sub;
    const role = (payload as any).role as 'Admin' | 'Cajero' | 'Cliente' | 'admin' | 'user';

    const id = typeof sub === 'string' ? Number(sub) || sub : sub;

    // Guarda el usuario en la request (coincide con tu express.d.ts)
    (req as any).user = { id, role };

    return next();
  } catch (e: any) {
    return errorResponse(res, `Token inválido o expirado`, 401, e?.message);
  }
}
