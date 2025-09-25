// src/types/express.d.ts
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string | number;
      role: 'Admin' | 'Cajero' | 'Cliente' | 'admin' | 'user';
    };
  }
}

export {}; // asegura que el archivo sea un módulo
