// src/worker.ts
import 'dotenv/config';
import amqplib from 'amqplib';
import { AppDataSource } from './config/database';
import { asignarSiguiente } from './services/ticket.service';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'turnos.topic';

let conn: any;
let ch: any;

async function setupRabbit(): Promise<any> {
  conn = await (amqplib as any).connect(RABBITMQ_URL);
  ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  return ch;
}

/** --- Comportamiento ORIGINAL: no se toca --- */
async function consumeNotifyCustomer(channel: any) {
  const q1 = 'notify.customer';
  await channel.assertQueue(q1, { durable: true });
  await channel.bindQueue(q1, EXCHANGE, 'turno.*');

  channel.consume(q1, (msg: any) => {
    if (!msg) return;
    try {
      const content = msg.content.toString();
      console.log(`[notify.customer]`, content);
      // TODO: enviar email/sms...
      channel.ack(msg);
    } catch (e) {
      console.error('[notify.customer] error:', e);
      channel.nack(msg, false, false);
    }
  });
}

/** --- NUEVO: asignación de siguiente ticket para ventanillas --- */
async function consumeVentanillaRequests(channel: any) {
  const q2 = 'ventanillas.requests';
  await channel.assertQueue(q2, { durable: true });
  await channel.bindQueue(q2, EXCHANGE, 'ventanilla.request.next');

  channel.consume(q2, async (msg: any) => {
    if (!msg) return;
    try {
      const { ventanillaId } = JSON.parse(msg.content.toString());
      if (!ventanillaId) throw new Error('ventanillaId requerido');

      const asignado = await asignarSiguiente(Number(ventanillaId));
      if (!asignado) {
        console.log(`[ventanillas.requests] No hay tickets en espera para ventanilla ${ventanillaId}`);
      } else {
        console.log(
          `[ventanillas.requests] Asignado ticket ${asignado.codigo} a ventanilla ${ventanillaId}`
        );
      }

      channel.ack(msg);
    } catch (e) {
      console.error('[ventanillas.requests] error:', e);
      channel.nack(msg, false, false);
    }
  });
}

async function main() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('[worker] DB inicializada');
    }

    const channel = await setupRabbit();
    console.log('[worker] Conectado a RabbitMQ. Exchange:', EXCHANGE);

    await consumeNotifyCustomer(channel);
    await consumeVentanillaRequests(channel);

    console.log('Worker listo. Escuchando colas...');
  } catch (e) {
    console.error('Error al iniciar worker:', e);
    process.exit(1);
  }
}

async function shutdown() {
  try { if (ch) await ch.close(); } catch {}
  try { if (conn) await conn.close(); } catch {}
  try { if (AppDataSource.isInitialized) await AppDataSource.destroy(); } catch {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
