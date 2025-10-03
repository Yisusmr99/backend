// src/index.ts
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';

import { AppDataSource } from './config/database';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import ventanillasRoutes from './routes/ventanillas.routes';
import ticketsRoutes from './routes/tickets.routes';
import { initializeSocketIO } from './services/socket.service';

dotenv.config();

const app = express();

// ===== Middlewares (siempre antes de las rutas) =====
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(morgan('dev'));
app.use(express.json());

// ===== Healthcheck =====
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ===== Rutas =====
app.use('/api/auth', authRoutes);
app.use('/api/ventanillas', ventanillasRoutes);
app.use('/api/tickets', ticketsRoutes); // <- tickets

// ===== 404 =====
app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

// ===== Arranque =====
const PORT = env.port;

// Creamos un servidor HTTP en lugar de usar app.listen directamente
const server = http.createServer(app);

AppDataSource.initialize()
  .then(() => {
    // Inicializamos el servicio de WebSockets
    const io = initializeSocketIO(server);
    
    // Iniciamos el servidor HTTP
    server.listen(PORT, () => {
      console.log(`API escuchando en puerto ${PORT}`);
      console.log(`Entorno: ${env.nodeEnv}`);
      console.log('WebSocket server inicializado');
    });
  })
  .catch((err) => {
    console.error('Error al iniciar:', err);
    process.exit(1);
  });

export default app;
