import { Router } from 'express';
import {
  getVentanillas,
  getVentanillaById,
  createVentanilla,
  updateVentanilla,
  deleteVentanilla
} from '../controllers/ventanillas.controller';

const router = Router();

router.get('/', getVentanillas);
router.get('/:id', getVentanillaById);
router.post('/', createVentanilla);
router.put('/:id', updateVentanilla);
router.delete('/:id', deleteVentanilla);

export default router;
