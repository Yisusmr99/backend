import 'dotenv/config';
import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'turnos.topic';

async function main() {
    const conn = await amqplib.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });

    // Ejemplo: cola de notificaciones a cliente
    const q1 = 'notify.customer';
    await ch.assertQueue(q1, { durable: true });
    await ch.bindQueue(q1, EXCHANGE, 'turno.*');

    ch.consume(q1, (msg) => {
        if (!msg) return;
        const content = msg.content.toString();
        console.log(`[notify.customer]`, content);
        // TODO: enviar email/sms...
        ch.ack(msg);
    });

    console.log('Worker listo. Escuchando colas...');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
