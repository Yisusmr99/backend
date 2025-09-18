// Rutas de ejemplo
import { Router } from 'express';
import { ExampleController } from '../controllers/example.controller';

const router = Router();

router.get('/', ExampleController.getExample);

export default router;
