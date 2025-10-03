// src/controllers/tickets.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { success, error as errorResponse } from '../utils/response.util';

import { Turno } from '../models/turno.entity';
import {
  crearTicket as srvCrearTicket,
  pedirSiguiente as srvPedirSiguiente,
  cambiarEstado as srvCambiarEstado,
  listarTicketsEsperando as srvListarTicketsEsperando,
  obtenerSiguienteDeCola as srvObtenerSiguienteDeCola,
} from '../services/ticket.service';

// Estados que maneja la app para validar payloads
type TicketStatus = 'WAITING' | 'CALLING' | 'SERVED' | 'CANCELLED';

/* ---------- TYPE GUARD para validar estados ---------- */
// Permitimos SERVED, DONE o CANCELLED como estados finales distintos
type ValidState = 'SERVED' | 'DONE' | 'CANCELLED';
function isValidState(s: string): s is ValidState {
  return s === 'SERVED' || s === 'DONE' || s === 'CANCELLED';
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
 * Cambia estado a SERVED, DONE o CANCELLED
 * body: { estado: 'SERVED'|'DONE'|'CANCELLED', porIdUsuario?: number }
 */
export async function cambiarEstado(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { estado, porIdUsuario } = req.body as {
      estado: string;
      porIdUsuario?: number;
    };

    if (!isValidState(estado)) {
      return errorResponse(res, 'Estado inválido. Solo se permite SERVED, DONE o CANCELLED', 400);
    }

    // ahora TS sabe que estado es 'SERVED'|'DONE'|'CANCELLED'
    const updated = await srvCambiarEstado(id, estado as ValidState, porIdUsuario);
    
    // Mensaje personalizado según el estado
    let mensaje;
    if (estado === 'SERVED') {
      mensaje = 'Ticket marcado como atendido';
    } else if (estado === 'DONE') {
      mensaje = 'Ticket finalizado completamente';
    } else if (estado === 'CANCELLED') {
      mensaje = 'Ticket cancelado';
    }
    return success(res, updated, mensaje);
  } catch (err) {
    console.error('[tickets.cambiarEstado] error:', err);
    return errorResponse(res, 'Error al cambiar estado del ticket', 500, err);
  }
}

/**
 * POST /api/tickets/ventanillas/:ventanillaId/tipo/:tipo/next
 * Obtiene el siguiente mensaje de una cola específica según tipo
 */
export async function obtenerSiguienteDeCola(req: Request, res: Response) {
  try {
    const ventanillaId = Number(req.params.ventanillaId);
    const tipo = req.params.tipo as TipoTurno;
    
    if (!ventanillaId || Number.isNaN(ventanillaId)) {
      return errorResponse(res, 'ventanillaId inválido', 400);
    }
    
    if (tipo !== 'C' && tipo !== 'V') {
      return errorResponse(res, 'tipo inválido. Debe ser C o V', 400);
    }
    
    const turno = await srvObtenerSiguienteDeCola(ventanillaId, tipo);
    
    if (!turno) {
      return success(res, null, `No hay mensajes en la cola para tickets de tipo ${tipo}`);
    }
    
    return success(res, turno, `Ticket de tipo ${tipo} asignado a ventanilla ${ventanillaId}`);
  } catch (err) {
    console.error('[tickets.obtenerSiguienteDeCola] error:', err);
    return errorResponse(res, 'Error al obtener el siguiente mensaje de la cola', 500, err);
  }
}

export async function listarTicketsEsperando(req: Request, res: Response) {
  try {
    const items = await srvListarTicketsEsperando();
    return success(res, items, 'Lista de tickets en espera');
  } catch (err) {
    console.error('[tickets.listarTicketsEsperando] error:', err);
    return errorResponse(res, 'Error al listar tickets en espera', 500, err);
  }
}