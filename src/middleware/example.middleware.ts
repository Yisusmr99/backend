// Middleware de ejemplo
import { Request, Response, NextFunction } from 'express';

export function exampleMiddleware(req: Request, res: Response, next: NextFunction) {
    console.log('Middleware ejecutado');
    next();
}
