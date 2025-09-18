import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.SOCKET_CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] }));
app.use(helmet());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: process.env.SOCKET_CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] }
});

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
});

const PORT = Number(process.env.PORT ?? 4000);
httpServer.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
