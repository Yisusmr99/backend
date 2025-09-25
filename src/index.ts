import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { AppDataSource } from './db/data-source';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';


async function bootstrap() {
await AppDataSource.initialize();
const app = express();


app.use(express.json());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));


app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);


app.use(errorHandler);


app.listen(env.port, () => {
console.log(`API escuchando en http://localhost:${env.port}`);
});
}


bootstrap().catch((e) => {
console.error('Error al iniciar:', e);
process.exit(1);
});