// src/routes/tickets.routes.ts
import { Router } from 'express';
import { 
  crear, 
  listar, 
  pedirSiguiente, 
  cambiarEstado, 
  listarTicketsEsperando,
  obtenerSiguienteDeCola 
} from '../controllers/tickets.controller';

const router = Router();

// Crear un nuevo ticket (turno) en estado 'en_espera'
router.post('/', crear);

// Listar últimos tickets (turnos)
router.get('/', listar);

// La ventanilla solicita el siguiente ticket en espera y lo pasa a 'atendiendo'
router.post('/ventanillas/:ventanillaId/next', pedirSiguiente);

// Cambiar estado de un ticket (en_espera | atendiendo | atendido)
router.patch('/:id/estado', cambiarEstado);

// Obtener el siguiente mensaje de una cola específica según tipo (C o V)
router.post('/ventanillas/:ventanillaId/tipo/:tipo/next', obtenerSiguienteDeCola);

router.get('/esperando', listarTicketsEsperando);

export default router;
