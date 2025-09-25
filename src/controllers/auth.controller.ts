// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import * as Auth from '../services/auth.service';
import { success, error } from '../utils/response.util';

export const register = async (req: Request, res: Response) => {
  try {
    const { correo, contrasenia, rol } = req.body;
    const role = (rol ?? 'Cliente') as 'Admin' | 'Cajero' | 'Cliente';
    const user = await Auth.register(correo, contrasenia, role);
    return success(res, user, 'Usuario registrado', 201);
  } catch (err: any) {
    return error(res, 'Error al registrar usuario', 400, err.message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { correo, contrasenia } = req.body;
    const result = await Auth.login(correo, contrasenia);
    return success(res, result, 'Inicio de sesión exitoso');
  } catch (err: any) {
    return error(res, 'Error al iniciar sesión', 401, err.message);
  }
};

export const me = async (req: Request, res: Response) => {
  return success(res, (req as any).user, 'Usuario autenticado');
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await Auth.refresh(refreshToken, req.ip, req.headers['user-agent']);
    return success(res, result, 'Token renovado');
  } catch (err: any) {
    return error(res, 'Error al renovar token', 401, err.message);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    await Auth.logout(refreshToken);
    return success(res, null, 'Sesión cerrada');
  } catch (err: any) {
    return error(res, 'Error al cerrar sesión', 400, err.message);
  }
};

export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as number;
    await Auth.logoutAll(userId);
    return success(res, null, 'Todas las sesiones revocadas');
  } catch (err: any) {
    return error(res, 'Error al revocar sesiones', 400, err.message);
  }
};
