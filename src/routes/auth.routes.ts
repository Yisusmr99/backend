// src/routes/auth.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth.schema';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';

const router = Router();

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', validate(refreshSchema), ctrl.refresh);
router.post('/logout', ctrl.logout);

router.get('/me', authenticate, ctrl.me);
router.post('/logout-all', authenticate, ctrl.logoutAll);

router.get('/admin/secret', authenticate, authorizeRoles('Admin'), (_req, res) => res.json({ ok: true }));

export default router;
