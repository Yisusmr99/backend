
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import ventanillasRouter from './routes/ventanillas.routes';
import { AppDataSource } from './config/database';


const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.SOCKET_CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] }));
app.use(helmet());
app.use(morgan('dev'));

// Endpoint para pruebas de ventanillas
app.use('/ventanillas', ventanillasRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: process.env.SOCKET_CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] }
});

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
});


// Inicializar la conexión a la base de datos antes de iniciar el servidor
const PORT = Number(process.env.PORT ?? 4000);
AppDataSource.initialize()
    .then(() => {
        httpServer.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error('Error al inicializar la base de datos:', err);
    });
