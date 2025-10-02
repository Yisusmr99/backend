// src/queues/rabbit.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// Forzamos CommonJS + any para evitar incompatibilidades de tipos entre versiones de amqplib
const amqplib: any = require('amqplib');

const URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'turnos.topic';

let conn: any;
let ch: any;

async function ensureChannel(): Promise<any> {
  if (ch) return ch;

  console.log(`[rabbit] conectando a ${URL} …`);
  conn = await amqplib.connect(URL);

  conn.on('error', (e: any) => console.error('[rabbit] connection error:', e?.message ?? e));
  conn.on('close', () => {
    console.warn('[rabbit] connection closed');
    conn = undefined;
    ch = undefined;
  });

  ch = await conn.createChannel(); // canal normal
  ch.on('error', (e: any) => console.error('[rabbit] channel error:', e?.message ?? e));
  ch.on('close', () => {
    console.warn('[rabbit] channel closed');
    ch = undefined;
  });

  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  console.log(`[rabbit] canal listo. exchange='${EXCHANGE}'`);
  return ch;
}

/** Publica JSON y deja logs para depurar */
export async function publish(routingKey: string, payload: any): Promise<void> {
  const channel = await ensureChannel();
  const body = Buffer.from(JSON.stringify(payload));

  const ok = channel.publish(EXCHANGE, routingKey, body, {
    contentType: 'application/json',
    persistent: true,
  });

  console.log(`[rabbit] publish rk='${routingKey}' size=${body.length} ok=${ok}`);
}

/** Cierre ordenado (opcional) */
export async function closeRabbit(): Promise<void> {
  try { await ch?.close(); } catch {}
  try { await conn?.close(); } catch {}
  ch = undefined;
  conn = undefined;
}
