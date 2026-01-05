import { Router } from 'express';
import { 
  loginHandler, 
  refreshHandler, 
  forgotPasswordHandler, 
  resetPasswordHandler,
  validateResetTokenHandler 
} from './auth.controller.js';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);
router.get('/validate-reset-token', validateResetTokenHandler);

export default router;
