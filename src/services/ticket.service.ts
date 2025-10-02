// src/services/ticket.service.ts
import { AppDataSource } from '../config/database';
import { Turno } from '../models/turno.entity';
import { EventoTurno } from '../models/evento-turno.entity';
import { publish } from '../queues/rabbit';

export type TurnoStatus = 'CREATED' | 'WAITING' | 'CALLING' | 'SERVED' | 'CANCELLED';

/* ========= Helpers ========= */

// YYYY-MM-DD HH:mm (minuto actual) → rango [start, end)
function minuteWindow(date = new Date()) {
  const start = new Date(date);
  start.setSeconds(0, 0);
  const end = new Date(start);
  end.setMinutes(start.getMinutes() + 1);
  return { start, end };
}

function fmtYYMMDDHHmm(d = new Date()) {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const MM = String(d.getMinutes()).padStart(2, '0');
  return { ymd: `${yy}${mm}${dd}`, hm: `${HH}${MM}` };
}

/**
 * Genera código corto {TIPO}-{YYMMDD}-{HHmm}-{NN}
 * NN = secuencia por minuto y por tipo (2 dígitos)
 */
async function generarCodigo(tipo: 'C' | 'V'): Promise<string> {
  const repo = AppDataSource.getRepository(Turno);
  const now = new Date();
  const { start, end } = minuteWindow(now);
  const { ymd, hm } = fmtYYMMDDHHmm(now);

  // contamos cuántos del mismo tipo se crearon en este minuto
  const count = await repo
    .createQueryBuilder('t')
    .where('t.tipo = :tipo', { tipo })
    .andWhere('t.creado_el >= :start', { start })
    .andWhere('t.creado_el < :end', { end })
    .getCount();

  const seq = Math.min(count + 1, 99); // evita crecer demasiado
  const nn = String(seq).padStart(2, '0');

  return `${tipo}-${ymd}-${hm}-${nn}`;
}

export async function registrarEvento(
  idTicket: number,
  delEstado: TurnoStatus | null,
  aEstado: TurnoStatus | null,
  notas?: string,
  porIdUsuario?: number,
) {
  const repo = AppDataSource.getRepository(EventoTurno);
  const ev = repo.create({
    id_ticket: idTicket,
    delEstado,
    aEstado,
    notas: notas ?? null,
    por_id_usuario: porIdUsuario ?? null,
  } as Partial<EventoTurno>);
  await repo.save(ev);
}

/* ========= Casos de uso ========= */

/**
 * Crear ticket con tipo ('C' | 'V'), status WAITING y código corto.
 * Publica: turno.created + turno.status.WAITING
 */
export async function crearTicket(tipo: 'C' | 'V' = 'C') {
  const repo = AppDataSource.getRepository(Turno);

  const codigo = await generarCodigo(tipo);

  const t = repo.create({
    tipo,
    codigo,
    status: 'WAITING' as any,
    ventanilla: null as any,
    llamado_el: null as any,
    atendido_el: null as any,
    cancelado_el: null as any,
    actualizado_por_usuario: null as any,
  } as Partial<Turno>);

  const saved = await repo.save(t);

  await registrarEvento(saved.id, 'CREATED', 'WAITING', 'ticket creado');

  try {
    await publish('turno.created', {
      id: saved.id,
      tipo: (saved as any).tipo,
      codigo: (saved as any).codigo,
      estado: (saved as any).status,
      ts: new Date().toISOString(),
    });

    await publish('turno.status.WAITING', {
      id: saved.id,
      tipo: (saved as any).tipo,
      codigo: (saved as any).codigo,
      status: 'WAITING',
      ts: new Date().toISOString(),
    });
  } catch {}

  return saved;
}

/* Las demás funciones (cambiarEstado, pedirSiguiente, asignarSiguiente)
   se mantienen igual, pero si quieres también incluir 'tipo' en los publish, añade
   `tipo: (saved as any).tipo` en sus payloads. */

/**
 * Cambiar estado del ticket a CALLING/SERVED/CANCELLED.
 * Publica:
 *  - turno.status.changed
 *  - turno.status.<ESTADO>
 */
export async function cambiarEstado(
  id: number,
  alEstado: Exclude<TurnoStatus, 'CREATED' | 'WAITING'>,
  porIdUsuario?: number,
) {
  const repo = AppDataSource.getRepository(Turno);
  const t = await repo.findOne({ where: { id } as any });
  if (!t) throw new Error('Ticket no encontrado');

  const del = (t as any).status as TurnoStatus;

  (t as any).status = alEstado as any;

  const now = new Date();
  if (alEstado === 'CALLING') (t as any).llamado_el = now as any;
  if (alEstado === 'SERVED') (t as any).atendido_el = now as any;
  if (alEstado === 'CANCELLED') (t as any).cancelado_el = now as any;

  if (porIdUsuario) (t as any).actualizado_por_usuario = porIdUsuario as any;

  const saved = await repo.save(t);

  await registrarEvento(id, del, alEstado, 'cambio de estado', porIdUsuario);

  try {
    await publish('turno.status.changed', {
      id: saved.id,
      codigo: (saved as any).codigo,
      de: del,
      a: alEstado,
      actualizado_el: (saved as any).actualizado_el,
    });

    // NUEVO: routing key por estado actual
    await publish(`turno.status.${alEstado}`, {
      id: saved.id,
      codigo: (saved as any).codigo,
      status: alEstado,
      ts: new Date().toISOString(),
    });
  } catch {
    /* noop */
  }

  return saved;
}

/**
 * Obtener siguiente ticket en WAITING, asignarlo a una ventanilla y pasarlo a CALLING.
 * Publica:
 *  - turno.calling
 *  - turno.status.CALLING
 *
 * (Esta es la función que usa tu worker; mantenemos alias más abajo)
 */
export async function pedirSiguiente(ventanillaId: number) {
  const repoTurno = AppDataSource.getRepository(Turno);

  const next = await repoTurno.findOne({
    where: { status: 'WAITING' as any } as any,
    order: { id: 'ASC' as any },
  });

  if (!next) return null;

  (next as any).ventanilla = ventanillaId as any;
  (next as any).status = 'CALLING' as any;
  (next as any).llamado_el = new Date() as any;

  const saved = await repoTurno.save(next);

  await registrarEvento(saved.id, 'WAITING', 'CALLING', 'asignado a ventanilla');

  try {
    await publish('turno.calling', {
      id: saved.id,
      codigo: (saved as any).codigo,
      ventanilla: (saved as any).ventanilla,
      llamado_el: (saved as any).llamado_el,
    });

    // NUEVO: routing key por estado CALLING
    await publish('turno.status.CALLING', {
      id: saved.id,
      codigo: (saved as any).codigo,
      status: 'CALLING',
      ts: new Date().toISOString(),
    });
  } catch {
    /* noop */
  }

  return saved;
}

/**
 * Alias para compatibilidad con el worker existente.
 */
export async function asignarSiguiente(ventanillaId: number) {
  return pedirSiguiente(ventanillaId);
}
