import { Router } from 'express';
import { recordPayment, getInvoicePayments } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', recordPayment);
router.get('/invoice/:invoiceId', getInvoicePayments);

export default router;
