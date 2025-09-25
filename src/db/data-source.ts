import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';


export const AppDataSource = new DataSource({
type: 'mysql',
host: env.db.host,
port: env.db.port,
username: env.db.user,
password: env.db.pass,
database: env.db.name,
entities: [User, RefreshToken],
synchronize: true, // ❗ Cambiar a false en producción y usar migrations
logging: false,
});