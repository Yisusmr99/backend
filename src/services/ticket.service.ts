// src/services/ticket.service.ts
import { AppDataSource } from '../config/database';
import { Turno } from '../models/turno.entity';
import { EventoTurno } from '../models/evento-turno.entity';
import { publish, sendToQueue } from '../queues/rabbit';
import { emitToChannel } from './socket.service';

export type TurnoStatus = 'CREATED' | 'WAITING' | 'CALLING' | 'SERVED' | 'CANCELLED' | 'DONE';

/* ========= Helpers ========= */

// YYYY-MM-DD HH:mm (minuto actual) → rango [start, end)
function minuteWindow(date = new Date()) {
  const start = new Date(date);
  start.setSeconds(0, 0);
  const end = new Date(start);
  end.setMinutes(start.getMinutes() + 1);
  return { start, end };
}

/**
 * Genera código corto {TIPO}-{YYMMDD}-{HHmm}-{NN}
 * NN = secuencia por minuto y por tipo (2 dígitos)
 */
async function generarCodigo(tipo: 'C' | 'V'): Promise<string> {
  const repo = AppDataSource.getRepository(Turno);
  const now = new Date(); // Fecha actual local
  
  // Ajustar la fecha para trabajar con la zona horaria local
  // rango del día (00:00 a 23:59) en la zona horaria local
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  
  // Mostrar información de depuración
  console.log(`Generando código para la fecha: ${now.toISOString()}`);
  console.log(`Rango de búsqueda: ${start.toISOString()} hasta ${end.toISOString()}`);

  // contamos cuántos tickets del mismo tipo se han creado en el día
  const count = await repo
    .createQueryBuilder('t')
    .where('t.tipo = :tipo', { tipo })
    .andWhere('t.creado_el >= :start', { start })
    .andWhere('t.creado_el < :end', { end })
    .getCount();
  console.log(`Tickets del tipo ${tipo} creados hoy: ${count}`);

  // correlativo del día
  const seq = count + 1;

  return `${tipo}-${seq}`;
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
 * Emite WebSocket: ticket.created
 */
export async function crearTicket(tipo: 'C' | 'V' = 'C') {

  const queueName = tipo === 'C' ? 'cola.clientes' : 'cola.ventanillas';
  const repo = AppDataSource.getRepository(Turno);

  const codigo = await generarCodigo(tipo);

  // Crear el objeto con la hora actual local explícitamente
  const now = new Date();
  
  const t = repo.create({
    tipo,
    codigo,
    status: 'WAITING' as any,
    ventanilla: null as any,
    llamado_el: null as any,
    atendido_el: null as any,
    cancelado_el: null as any,
    actualizado_por_usuario: null as any,
    creado_el: now, // Forzamos la fecha actual de manera explícita
    actualizado_el: now,
  } as Partial<Turno>);

  console.log(`Creando ticket a las: ${now.toISOString()} (hora local: ${now.toString()})`);
  const saved = await repo.save(t);

  await registrarEvento(saved.id, 'CREATED', 'WAITING', 'ticket creado');

  try {
    console.log('Publicando en RabbitMQ...');
    
    // También mantenemos la publicación en el exchange para compatibilidad
    await sendToQueue(queueName, {
      id: saved.id,
      tipo: (saved as any).tipo,
      codigo: (saved as any).codigo,
      estado: (saved as any).status,
      ts: new Date().toISOString(),
    });

    // Enviar notificación por WebSocket
    emitToChannel('tickets', 'ticket.created', {
      id: saved.id,
      tipo: (saved as any).tipo,
      codigo: (saved as any).codigo,
      estado: (saved as any).status,
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error publicando en RabbitMQ o WebSocket:', error);
  }

  return saved;
}

/* Las demás funciones (cambiarEstado, pedirSiguiente, asignarSiguiente)
   se mantienen igual, pero si quieres también incluir 'tipo' en los publish, añade
   `tipo: (saved as any).tipo` en sus payloads. */

/**
 * Cambiar estado del ticket a SERVED, DONE o CANCELLED.
 * Solo actualiza el estado en la base de datos y notifica por WebSocket.
 * Ya no publica en RabbitMQ.
 */
export async function cambiarEstado(
  id: number,
  alEstado: 'SERVED' | 'DONE' | 'CANCELLED',
  porIdUsuario?: number,
) {
  // Usamos el estado tal como viene, sin normalizar
  const estadoNormalizado = alEstado;
  
  const repo = AppDataSource.getRepository(Turno);
  const t = await repo.findOne({ where: { id } as any });
  if (!t) throw new Error('Ticket no encontrado');

  const del = (t as any).status as TurnoStatus;

  // Solo permitimos cambiar a SERVED, DONE o CANCELLED
  if (estadoNormalizado !== 'SERVED' && estadoNormalizado !== 'DONE' && estadoNormalizado !== 'CANCELLED') {
    throw new Error(`Solo se permite cambiar al estado SERVED, DONE o CANCELLED. Estado recibido: ${alEstado}`);
  }

  (t as any).status = estadoNormalizado as any;

  // Actualizar la fecha según el estado con hora local explícita
  const now = new Date();
  console.log(`Cambiando estado a ${estadoNormalizado} a las: ${now.toISOString()} (hora local: ${now.toString()})`);
  
  if (estadoNormalizado === 'SERVED' || estadoNormalizado === 'DONE') {
    (t as any).atendido_el = now as any;
  } else if (estadoNormalizado === 'CANCELLED') {
    (t as any).cancelado_el = now as any;
  }
  
  // Actualizar siempre la fecha de actualización
  (t as any).actualizado_el = now as any;

  if (porIdUsuario) (t as any).actualizado_por_usuario = porIdUsuario as any;

  const saved = await repo.save(t);

  // Registrar el evento del cambio de estado con el mensaje apropiado
  let mensaje;
  if (estadoNormalizado === 'SERVED') {
    mensaje = 'ticket atendido';
  } else if (estadoNormalizado === 'DONE') {
    mensaje = 'ticket finalizado';
  } else if (estadoNormalizado === 'CANCELLED') {
    mensaje = 'ticket cancelado';
  }
  await registrarEvento(id, del, estadoNormalizado, mensaje, porIdUsuario);

  try {
    // Solo emitimos evento por WebSocket (ya no publicamos en RabbitMQ)
    emitToChannel('tickets', `ticket.status.${estadoNormalizado}`, {
      id: saved.id,
      codigo: (saved as any).codigo,
      status: estadoNormalizado,
      tipo: (saved as any).tipo,
      ts: new Date().toISOString(),
    });
    
    console.log(`[WebSocket] Notificación enviada: ticket ${saved.id} pasó de ${del} a ${estadoNormalizado}`);
  } catch (error) {
    console.error(`Error al emitir evento WebSocket para ticket ${id}:`, error);
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

  // Usar hora local explícita
  const now = new Date();
  console.log(`Llamando ticket a las: ${now.toISOString()} (hora local: ${now.toString()})`);
  
  (next as any).ventanilla = ventanillaId as any;
  (next as any).status = 'CALLING' as any;
  (next as any).llamado_el = now as any;
  (next as any).actualizado_el = now as any;

  const saved = await repoTurno.save(next);

  await registrarEvento(saved.id, 'WAITING', 'CALLING', 'asignado a ventanilla');

  try {
    // Importamos la función sendToQueue
    const { sendToQueue } = require('../queues/rabbit');
    
    // Enviamos a la cola directa
    await sendToQueue('tickets.queue', {
      id: saved.id,
      codigo: (saved as any).codigo,
      ventanilla: (saved as any).ventanilla,
      llamado_el: (saved as any).llamado_el,
      event: 'calling'
    });
    
    // Mantenemos la publicación en el exchange para compatibilidad
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

    // Emitir evento por WebSocket
    emitToChannel('tickets', 'ticket.calling', {
      id: saved.id,
      codigo: (saved as any).codigo,
      ventanilla: (saved as any).ventanilla,
      tipo: (saved as any).tipo,
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

/**
 * Obtener el siguiente mensaje de la cola según el tipo de turno
 * @param idVentanilla ID de la ventanilla que solicita el siguiente turno
 * @param tipo Tipo de turno ('C' para cliente o 'V' para ventanilla)
 * @returns El turno asignado o null si no hay tickets en espera
 */
export async function obtenerSiguienteDeCola(idVentanilla: number, tipo: 'C' | 'V' = 'C') {
  // Determinar la cola correcta según el tipo de turno
  const queueName = tipo === 'C' ? 'cola.clientes' : 'cola.ventanillas';
  
  // Declarar las variables de conexión fuera del try para que sean accesibles en el catch
  let conn: any = null;
  let ch: any = null;
  
  try {
    // Importar amqplib dinámicamente para acceder directamente a la cola
    const amqplib = require('amqplib');
    const URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    
    // Conectar a RabbitMQ
    conn = await amqplib.connect(URL);
    ch = await conn.createChannel();
    
    // Asegurar que la cola existe
    await ch.assertQueue(queueName, { durable: true });
    
    // Obtener un mensaje de la cola (noAck: false significa que necesitamos confirmar la recepción)
    const msg = await ch.get(queueName, { noAck: false });
    
    if (!msg) {
      console.log(`[${queueName}] No hay mensajes en la cola para ventanilla ${idVentanilla}`);
      await conn.close();
      return null;
    }
    
    // Parsear el mensaje
    const content = JSON.parse(msg.content.toString());
    console.log(`[${queueName}] Mensaje obtenido para ventanilla ${idVentanilla}:`, content);
    
    // Confirmar la recepción del mensaje - esto ELIMINA el mensaje de la cola
    // El mensaje no se eliminará de la cola hasta que se haga ack y la conexión siga activa
    ch.ack(msg);
    
    // NO cerramos la conexión hasta que estemos seguros de que todo el procesamiento se ha completado
    // Para asegurar que el mensaje sea eliminado de la cola
    
    // Obtener el turno actualizado desde la base de datos para asignarlo a la ventanilla
    const repoTurno = AppDataSource.getRepository(Turno);
    const turno = await repoTurno.findOne({ where: { id: content.id } as any });
    
    if (!turno) {
      console.error(`[${queueName}] No se encontró el ticket con ID ${content.id} en la base de datos`);
      return null;
    }
    
    // Actualizar el estado del turno y asignarlo a la ventanilla con hora local explícita
    const now = new Date();
    console.log(`Asignando ticket de cola a ventanilla ${idVentanilla} a las: ${now.toISOString()} (hora local: ${now.toString()})`);
    
    (turno as any).ventanilla = idVentanilla as any;
    (turno as any).status = 'CALLING' as any;
    (turno as any).llamado_el = now as any;
    (turno as any).actualizado_el = now as any;
    
    const saved = await repoTurno.save(turno);
    
    await registrarEvento(saved.id, 'WAITING', 'CALLING', `asignado a ventanilla ${idVentanilla}`);
    
    // Anunciar por WebSocket que se está llamando a este turno
    try {
      emitToChannel('tickets', 'ticket.calling', {
        id: saved.id,
        codigo: (saved as any).codigo,
        ventanilla: idVentanilla,
        tipo: (saved as any).tipo,
        status: 'CALLING',
        ts: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error al anunciar el turno por WebSocket o RabbitMQ:', error);
    }
    
    // Ahora que todo se ha procesado correctamente, cerramos la conexión
    await conn.close();
    console.log(`[${queueName}] Conexión cerrada después de procesar el mensaje correctamente`);
    
    return saved;
  } catch (error) {
    console.error(`Error al obtener mensaje de la cola ${queueName}:`, error);
    
    // En caso de error, intentamos cerrar la conexión si existe
    try {
      if (conn) {
        console.log(`[${queueName}] Cerrando conexión después de un error`);
        await conn.close();
      }
    } catch (closeError) {
      console.error(`Error al cerrar la conexión RabbitMQ:`, closeError);
    }
    
    return null;
  }
}

export async function listarTicketsEsperando() {
  const repo = AppDataSource.getRepository(Turno);
  const items = await repo.find({
    where: [{ status: 'WAITING' as any } as any, { creado_el: minuteWindow().start }], 
    order: { id: 'ASC' as any } 
  });
  
  // Emitir evento con la lista de tickets en espera
  try {
    emitToChannel('tickets', 'tickets.waiting.list', {
      count: items.length,
      tickets: items,
      ts: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error emitiendo lista de tickets en espera:', error);
  }
  
  return items;
}