import 'dotenv/config';


export const env = {
port: parseInt(process.env.PORT || '4000', 10),
nodeEnv: process.env.NODE_ENV || 'development',
corsOrigin: process.env.CORS_ORIGIN || '*',
db: {
host: process.env.DB_HOST || 'localhost',
port: parseInt(process.env.DB_PORT || '3306', 10),
user: process.env.DB_USER || 'root',
pass: process.env.DB_PASS || '',
name: process.env.DB_NAME || 'auth_demo',
},
jwt: {
accessSecret: process.env.JWT_ACCESS_SECRET || 'change',
refreshSecret: process.env.JWT_REFRESH_SECRET || 'change',
accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '6m',
refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
},
security: {
bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
},
};