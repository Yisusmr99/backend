import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    correo: z.string().email(),
    contrasenia: z.string().min(6),
    rol: z.enum(['Admin', 'Cajero', 'Cliente']).optional(), // default: Cliente
  }),
});

export const loginSchema = z.object({
  body: z.object({
    correo: z.string().email(),
    contrasenia: z.string().min(6),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});
