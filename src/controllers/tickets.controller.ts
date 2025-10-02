// src/controllers/tickets.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { success, error as errorResponse } from '../utils/response.util';

import { Turno } from '../models/turno.entity';
import {
  crearTicket as srvCrearTicket,
  pedirSiguiente as srvPedirSiguiente,
  cambiarEstado as srvCambiarEstado,
} from '../services/ticket.service';

// Estados que maneja la app para validar payloads
type TicketStatus = 'WAITING' | 'CALLING' | 'SERVED' | 'CANCELLED';

/* ---------- TYPE GUARD para estrechar el tipo ---------- */
type FinalState = 'CALLING' | 'SERVED' | 'CANCELLED';
function isFinalState(s: TicketStatus): s is FinalState {
  return s === 'CALLING' || s === 'SERVED' || s === 'CANCELLED';
}
/* ------------------------------------------------------- */

/**
 * POST /api/tickets
 * Crea ticket con status WAITING y código T-0000xx
 */

type TipoTurno = 'C' | 'V';
// ...

export async function crear(req: Request, res: Response) {
  try {
    const { tipo } = (req.body || {}) as { tipo?: TipoTurno };
    const tipoSan = (tipo === 'V' ? 'V' : 'C'); // default C
    const saved = await srvCrearTicket(tipoSan);
    return success(res, saved, 'Ticket creado', 201);
  } catch (err) {
    console.error('[tickets.crear] error:', err);
    return errorResponse(res, 'Error al crear ticket', 500, err);
  }
}

/**
 * GET /api/tickets
 * Lista últimos 50 tickets
 */
export async function listar(_req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Turno);
    const items = await repo.find({ order: { id: 'DESC' as any }, take: 50 });
    return success(res, items, 'Lista de tickets');
  } catch (err) {
    console.error('[tickets.listar] error:', err);
    return errorResponse(res, 'Error al listar tickets', 500, err);
  }
}

/**
 * POST /api/tickets/ventanillas/:ventanillaId/next
 * Asigna siguiente ticket WAITING a ventanilla y lo pasa a CALLING
 */
export async function pedirSiguiente(req: Request, res: Response) {
  try {
    const ventanillaId = Number(req.params.ventanillaId);
    if (!ventanillaId || Number.isNaN(ventanillaId)) {
      return errorResponse(res, 'ventanillaId inválido', 400);
    }
    const asignado = await srvPedirSiguiente(ventanillaId);
    if (!asignado) return success(res, null, 'No hay tickets en espera');
    return success(res, asignado, 'Ticket asignado a ventanilla');
  } catch (err) {
    console.error('[tickets.pedirSiguiente] error:', err);
    return errorResponse(res, 'Error al pedir siguiente ticket', 500, err);
  }
}

/**
 * PATCH /api/tickets/:id/estado
 * Cambia estado a CALLING|SERVED|CANCELLED
 * body: { estado: 'CALLING'|'SERVED'|'CANCELLED', porIdUsuario?: number }
 */
export async function cambiarEstado(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { estado, porIdUsuario } = req.body as {
      estado: TicketStatus;
      porIdUsuario?: number;
    };

    if (!isFinalState(estado)) {
      return errorResponse(res, 'Estado inválido. Permitidos: CALLING, SERVED, CANCELLED', 400);
    }

    // aquí TS ya sabe que estado es 'CALLING'|'SERVED'|'CANCELLED'
    const updated = await srvCambiarEstado(id, estado, porIdUsuario);
    return success(res, updated, 'Estado actualizado');
  } catch (err) {
    console.error('[tickets.cambiarEstado] error:', err);
    return errorResponse(res, 'Error al cambiar estado del ticket', 500, err);
  }
}
