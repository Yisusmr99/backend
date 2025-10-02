// scripts/rabbit_debug_bind.ts
import 'dotenv/config';
import amqplib from 'amqplib';

async function main() {
  const URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const EX = process.env.RABBITMQ_EXCHANGE || 'turnos.topic';

  console.log('[bind] conectando a', URL, 'exchange=', EX);
  const conn = await amqplib.connect(URL);
  const ch = await conn.createChannel();
  await ch.assertExchange(EX, 'topic', { durable: true });

  // Crea una cola DEBUG y la bindea a turno.*
  const QUEUE = 'debug.turno';
  await ch.assertQueue(QUEUE, { durable: true });
  await ch.bindQueue(QUEUE, EX, 'turno.*');
  console.log(`[bind] cola '${QUEUE}' bindeada a '${EX}' con rk 'turno.*'`);

  // Consume y loguea
  await ch.consume(QUEUE, (msg) => {
    if (!msg) return;
    console.log(`[debug.turno] rk=${msg.fields.routingKey} body=${msg.content.toString()}`);
    ch.ack(msg);
  });

  console.log('[bind] listo. Deja este proceso abierto para ver mensajes.');
}

main().catch((e) => {
  console.error('[bind] ERROR', e);
  process.exit(1);
});
