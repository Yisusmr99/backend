import { Router } from 'express';
import {
  getVentanillas,
  getVentanillaById,
  createVentanilla,
  updateVentanilla,
  deleteVentanilla,
  toggleVentanillaActivo
} from '../controllers/ventanillas.controller';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';

const router = Router();

router.use(authenticate);
router.get('/', getVentanillas);
router.get('/:id', getVentanillaById);
router.post('/', authorizeRoles('Admin', 'Cajero'), createVentanilla);
router.put('/:id', authorizeRoles('Admin', 'Cajero'), updateVentanilla);
router.delete('/:id', authorizeRoles('Admin', 'Cajero'), deleteVentanilla);


router.put('/:id/change-status', toggleVentanillaActivo);

export default router;
