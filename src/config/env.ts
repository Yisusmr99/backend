import 'dotenv/config';


export const env = {
port: parseInt(process.env.PORT || '4000', 10),
nodeEnv: process.env.NODE_ENV || 'development',
corsOrigin: process.env.CORS_ORIGIN || process.env.SOCKET_CORS_ORIGIN || '*',
db: {
host: process.env.DB_HOST || 'localhost',
port: parseInt(process.env.DB_PORT || '3306', 10),
user: process.env.DB_USER || 'root',
pass: process.env.DB_PASS || '',
name: process.env.DB_NAME || 'auth_demo',
url: process.env.DATABASE_URL, // Railway puede proporcionar una URL completa
},
jwt: {
accessSecret: process.env.JWT_ACCESS_SECRET || 'change',
refreshSecret: process.env.JWT_REFRESH_SECRET || 'change',
accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_ACCESS_TTL || '6m',
refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_TTL || '7d',
},
security: {
bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
},
rabbitmq: {
url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
exchange: process.env.RABBITMQ_EXCHANGE || 'turnos.topic',
}
,
telegram: {
	botToken: process.env.TELEGRAM_BOT_TOKEN || '',
	chatId: process.env.TELEGRAM_CHAT_ID || '',
	apiBase: process.env.TELEGRAM_API_BASE || 'https://api.telegram.org'
}
};