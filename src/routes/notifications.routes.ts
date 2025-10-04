import { Router } from 'express';
import { sendTelegram } from '../controllers/notifications.controller';

const router = Router();

// POST /api/notifications/telegram
router.post('/telegram', sendTelegram);

export default router;
