    // src/config/database.ts
    import 'reflect-metadata';
    import { DataSource } from 'typeorm';
    import dotenv from 'dotenv';
    import path from 'path';

    dotenv.config();

    const entitiesGlob = [
    path.join(__dirname, '..', 'entities', '**', '*.{ts,js}'),
    path.join(__dirname, '..', 'models', '**', '*.{ts,js}'),
    ];

    export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: entitiesGlob,
    synchronize: true, 
    logging: false,
    });
