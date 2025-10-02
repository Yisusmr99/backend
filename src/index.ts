// src/index.ts
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { AppDataSource } from './config/database';
import authRoutes from './routes/auth.routes';
import ventanillasRoutes from './routes/ventanillas.routes';
import ticketsRoutes from './routes/tickets.routes';

dotenv.config();

const app = express();

// ===== Middlewares (siempre antes de las rutas) =====
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
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
const PORT = Number(process.env.PORT || 4000);

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al iniciar:', err);
    process.exit(1);
  });

export default app;
