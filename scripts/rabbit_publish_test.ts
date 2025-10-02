import 'dotenv/config';
import amqplib from 'amqplib';

async function main() {
  const URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const EX = process.env.RABBITMQ_EXCHANGE || 'turnos.topic';

  // rk por argv o default
  const rk = process.argv[2] || 'turno.created';
  const payload = {
    id: 123,
    codigo: 'T-000123',
    estado: 'WAITING',
    ts: new Date().toISOString(),
  };

  console.log('[pubtest] conectando a', URL, 'exchange=', EX);
  const conn = await amqplib.connect(URL);
  const ch = await conn.createChannel();
  await ch.assertExchange(EX, 'topic', { durable: true });

  const ok = ch.publish(EX, rk, Buffer.from(JSON.stringify(payload)), {
    contentType: 'application/json',
    persistent: true,
  });
  console.log(`[pubtest] published rk=${rk} ok=${ok} payload=`, payload);

  await ch.close();
  await conn.close();
}

main().catch((e) => {
  console.error('[pubtest] ERROR', e);
  process.exit(1);
});
