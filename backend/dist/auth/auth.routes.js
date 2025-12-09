import { Router } from 'express';
import { loginHandler, refreshHandler } from './auth.controller.js';
const router = Router();
router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
export default router;
