import { Router } from 'express';
import { login, getCurrentUser, setupAdmin } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.post('/setup-admin', setupAdmin);

export default router;
