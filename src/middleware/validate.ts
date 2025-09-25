import { ZodTypeAny, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({ body: req.body, params: req.params, query: req.query });
      next();
    } catch (err: any) {
      const errors = err instanceof ZodError ? err.issues : err?.errors;
      return res.status(400).json({ message: 'Validación fallida', errors });
    }
  };
