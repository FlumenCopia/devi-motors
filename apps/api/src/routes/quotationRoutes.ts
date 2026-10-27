import { Router } from 'express';
import {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  convertQuotationToInvoice,
  previewQuotationHtml,
  downloadQuotationPdf
} from '../controllers/quotationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public/Iframe preview endpoints
router.get('/:id/preview', previewQuotationHtml);
router.get('/:id/pdf', downloadQuotationPdf);

// Protected endpoints
router.use(authenticate);

router.get('/', listQuotations);
router.post('/', createQuotation);
router.get('/:id', getQuotation);
router.put('/:id', updateQuotation);
router.patch('/:id/status', updateQuotationStatus);
router.post('/:id/convert', convertQuotationToInvoice);

export default router;
