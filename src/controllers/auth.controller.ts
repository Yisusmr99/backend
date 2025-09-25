// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import * as Auth from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  const { correo, contrasenia, rol } = req.body;
  const role = (rol ?? 'Cliente') as 'Admin' | 'Cajero' | 'Cliente';
  const user = await Auth.register(correo, contrasenia, role);
  res.status(201).json({ user });
};

export const login = async (req: Request, res: Response) => {
  const { correo, contrasenia } = req.body;
  const result = await Auth.login(correo, contrasenia);
  res.json(result);
};

export const me = async (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await Auth.refresh(refreshToken, req.ip, req.headers['user-agent']);
  res.json(result);
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  await Auth.logout(refreshToken);
  res.json({ message: 'Sesión cerrada' });
};

export const logoutAll = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as number;
  await Auth.logoutAll(userId);
  res.json({ message: 'Todas las sesiones revocadas' });
};
