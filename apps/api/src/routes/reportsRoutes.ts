import { Router } from 'express';
import { getFinancialReports } from '../controllers/reportsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getFinancialReports);

export default router;
