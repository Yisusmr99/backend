// Configuración de base de datos (ejemplo para TypeORM)
import { DataSource } from 'typeorm';
import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [__dirname + '/../models/*.ts'],
    synchronize: true,
});
