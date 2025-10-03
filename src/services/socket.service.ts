// src/services/socket.service.ts
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';

let io: SocketIOServer | null = null;

/**
 * Inicializa el servicio de WebSockets con el servidor HTTP
 * @param server Servidor HTTP de Express
 */
export function initializeSocketIO(server: http.Server) {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`[WebSocket] Nuevo cliente conectado: ${socket.id}`);

        // Suscripción a diferentes canales
        socket.on('subscribe:tickets', () => {
            socket.join('tickets');
            console.log(`[WebSocket] Cliente ${socket.id} suscrito a canal tickets`);
        });

        socket.on('disconnect', () => {
            console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
        });
    });

    console.log('[WebSocket] Servicio inicializado');
    return io;
}

/**
 * Emite un evento a todos los clientes conectados a un canal específico
 * @param channel Canal de comunicación
 * @param event Nombre del evento
 * @param data Datos a enviar
 */
export function emitToChannel(channel: string, event: string, data: any) {
    if (!io) {
        console.warn('[WebSocket] Intento de emisión sin servidor inicializado');
        return;
    }

    io.to(channel).emit(event, data);
    console.log(`[WebSocket] Emitido evento '${event}' a canal '${channel}'`);
}

/**
 * Emite un evento a todos los clientes conectados
 * @param event Nombre del evento
 * @param data Datos a enviar
 */
export function emitToAll(event: string, data: any) {
    if (!io) {
        console.warn('[WebSocket] Intento de emisión sin servidor inicializado');
        return;
    }

    io.emit(event, data);
    console.log(`[WebSocket] Emitido evento '${event}' a todos los clientes`);
}

export function getSocketIO() {
    return io;
}
