import { Router } from 'express';
import {
  listInvoices,
  getInvoice,
  calculateInvoice,
  createInvoiceDraft,
  updateInvoice,
  issueInvoice,
  deleteInvoice,
  restoreInvoice,
  previewInvoiceHtml,
  downloadInvoicePdf
} from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public/Iframe preview endpoints
router.get('/:id/preview', previewInvoiceHtml);
router.get('/:id/pdf', downloadInvoicePdf);

// Protected endpoints
router.use(authenticate);

router.get('/', listInvoices);
router.post('/calculate', calculateInvoice);
router.post('/', createInvoiceDraft);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.post('/:id/issue', issueInvoice);
router.delete('/:id', deleteInvoice);
router.post('/:id/restore', restoreInvoice);

export default router;
