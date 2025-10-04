// src/worker.ts
import 'dotenv/config';
import amqplib from 'amqplib';
import { AppDataSource } from './config/database';
import { sendTelegramMessage } from './services/telegram.service';

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

/** --- NUEVO: notificación por Telegram --- */
async function consumeTelegramNotifications(channel: any) {
  const qTelegram = 'telegram.notifications';
  await channel.assertQueue(qTelegram, { durable: true });

  channel.consume(qTelegram, async (msg: any) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());

      if (!payload.mensaje) {
        throw new Error('Mensaje requerido para notificación de Telegram');
      }

      console.log(`[telegram.notifications] Enviando mensaje: ${payload.mensaje}`);

      const result = await sendTelegramMessage(payload.mensaje);

      if (result.ok) {
        console.log(`[telegram.notifications] Mensaje enviado con éxito`);
        channel.ack(msg);
      } else {
        console.error(`[telegram.notifications] Error al enviar mensaje: ${result.description}`);
        // Solo rechazamos con reintento si es un error temporal
        const isTemporaryError =
          result.description?.includes('retry') ||
          result.description?.includes('too many requests');
        channel.nack(msg, false, isTemporaryError);
      }
    } catch (e) {
      console.error('[telegram.notifications] error:', e);
      // Si hay un error de parseo o en el servicio, no lo reintentamos
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

    await consumeTelegramNotifications(channel);

    console.log('Worker listo. Escuchando cola de notificaciones de Telegram...');
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
