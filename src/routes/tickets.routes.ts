// src/routes/tickets.routes.ts
import { Router } from 'express';
import { crear, listar, pedirSiguiente, cambiarEstado } from '../controllers/tickets.controller';

const router = Router();

// Crear un nuevo ticket (turno) en estado 'en_espera'
router.post('/', crear);

// Listar últimos tickets (turnos)
router.get('/', listar);

// La ventanilla solicita el siguiente ticket en espera y lo pasa a 'atendiendo'
router.post('/ventanillas/:ventanillaId/next', pedirSiguiente);

// Cambiar estado de un ticket (en_espera | atendiendo | atendido)
router.patch('/:id/estado', cambiarEstado);

export default router;
