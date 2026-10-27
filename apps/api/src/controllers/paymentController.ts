import { Request, Response } from 'express';
import { PaymentModel } from '../models/Payment';
import { InvoiceModel } from '../models/Invoice';
import { CustomerModel } from '../models/Customer';
import { AuditLogModel } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

export async function recordPayment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { invoiceId, amount, paymentDate, paymentMethod, transactionReference, notes } =
      req.body;

    if (!invoiceId || !amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'Valid invoiceId and positive amount are required.' });
      return;
    }

    const invoice = await InvoiceModel.findById(invoiceId);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    const payAmount = Number(amount);
    if (payAmount > (invoice.balanceDue || invoice.totalAmount)) {
      res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount}) cannot exceed remaining balance (₹${invoice.balanceDue}).`
      });
      return;
    }

    const payment = await PaymentModel.create({
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      amount: payAmount,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'bank_transfer',
      transactionReference: transactionReference?.trim(),
      notes,
      recordedBy: req.user?.name || 'Admin'
    });

    const newAmountPaid = (invoice.amountPaid || 0) + payAmount;
    const newBalanceDue = Math.max(0, invoice.totalAmount - newAmountPaid);
    const newPaymentStatus =
      newBalanceDue <= 0.01 ? 'paid' : newAmountPaid > 0 ? 'partially_paid' : 'unpaid';

    invoice.amountPaid = newAmountPaid;
    invoice.balanceDue = newBalanceDue;
    invoice.paymentStatus = newPaymentStatus;
    await invoice.save();

    // Update customer stats
    if (invoice.customer.id) {
      const customer = await CustomerModel.findById(invoice.customer.id);
      if (customer) {
        customer.totalPaid = (customer.totalPaid || 0) + payAmount;
        customer.outstandingBalance = Math.max(0, (customer.outstandingBalance || 0) - payAmount);
        await customer.save();
      }
    }

    // Audit log
    await AuditLogModel.create({
      action: 'RECORD_PAYMENT',
      resource: 'Payment',
      resourceId: payment._id.toString(),
      details: {
        invoiceNumber: invoice.invoiceNumber,
        amount: payAmount,
        paymentMethod
      },
      performedBy: req.user?.name || 'Admin'
    });

    res.status(201).json({ success: true, payment, invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInvoicePayments(req: Request, res: Response): Promise<void> {
  try {
    const { invoiceId } = req.params;
    const payments = await PaymentModel.find({ invoiceId }).sort({ paymentDate: -1, createdAt: -1 });
    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
