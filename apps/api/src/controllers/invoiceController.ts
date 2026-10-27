import { Request, Response } from 'express';
import { InvoiceModel } from '../models/Invoice';
import { CustomerModel } from '../models/Customer';
import { CompanySettingsModel } from '../models/CompanySettings';
import { AuditLogModel } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { getNextDocumentNumber, peekNextDocumentNumber } from '../services/counterService';
import { generateInvoiceHtml, renderPdfBuffer } from '../services/pdfService';
import {
  calculateLineItem,
  calculateDocumentTotals,
  validateOrderInvoiceDates,
  getFinancialYear
} from '@devi-motors/shared';

export async function listInvoices(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      type,
      status,
      paymentStatus,
      financialYear,
      customerId,
      page = 1,
      limit = 50
    } = req.query;

    const filter: any = {};

    if (type) filter.invoiceType = type;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (financialYear) filter.financialYear = financialYear;
    if (customerId) filter['customer.id'] = customerId;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { invoiceNumber: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { vehicleNumber: { $regex: q, $options: 'i' } },
        { purchaseOrderNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      InvoiceModel.find(filter).sort({ invoiceDate: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      InvoiceModel.countDocuments(filter)
    ]);

    res.json({
      success: true,
      invoices,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }
    res.json({ success: true, invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function calculateInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { lineItems, customerStateCode } = req.body;
    const isInterState = Boolean(customerStateCode && customerStateCode !== '32');

    const calculatedItems = (lineItems || []).map((item: any, idx: number) =>
      calculateLineItem({
        slNo: idx + 1,
        description: item.description,
        hsnSac: item.hsnSac || '998714',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'Nos',
        rate: Number(item.rate) || 0, // BEFORE GST
        discountType: item.discountType || 'fixed',
        discountValue: Number(item.discountValue) || 0,
        gstRate: Number(item.gstRate) || 18,
        isInterState
      })
    );

    const totals = calculateDocumentTotals(calculatedItems);
    res.json({ success: true, lineItems: calculatedItems, totals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createInvoiceDraft(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      invoiceType,
      invoiceDate,
      orderDate,
      vehicleNumber,
      purchaseOrderNumber,
      customer,
      hsnCode,
      lineItems,
      notes,
      paymentTerms
    } = req.body;

    // Validate dates if orderDate provided
    if (orderDate && invoiceDate) {
      const dateCheck = validateOrderInvoiceDates(orderDate, invoiceDate);
      if (!dateCheck.valid) {
        res.status(400).json({ success: false, message: dateCheck.error });
        return;
      }
    }

    const isInterState = Boolean(customer?.stateCode && customer.stateCode !== '32');

    const calculatedItems = (lineItems || []).map((item: any, idx: number) =>
      calculateLineItem({
        slNo: idx + 1,
        description: item.description,
        hsnSac: item.hsnSac || hsnCode || '998714',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'Nos',
        rate: Number(item.rate) || 0, // BEFORE GST
        discountType: item.discountType || 'fixed',
        discountValue: Number(item.discountValue) || 0,
        gstRate: Number(item.gstRate) || 18,
        isInterState
      })
    );

    const totals = calculateDocumentTotals(calculatedItems);
    const fy = getFinancialYear(invoiceDate || new Date());

    // Generate a temporary draft number or peek next sequence
    const nextNum = await peekNextDocumentNumber('invoice', invoiceDate);
    const invoiceNumber = `DRAFT-${nextNum}`;

    const settings = await CompanySettingsModel.findOne();

    const invoice = await InvoiceModel.create({
      invoiceType: invoiceType || 'vehicle',
      invoiceNumber,
      financialYear: fy.full,
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      orderDate,
      vehicleNumber: vehicleNumber?.trim().toUpperCase(),
      purchaseOrderNumber: purchaseOrderNumber?.trim(),
      customer,
      hsnCode: hsnCode || '998714',
      lineItems: calculatedItems,
      subtotalTaxable: totals.subtotalTaxable,
      totalCgst: totals.totalCgst,
      totalSgst: totals.totalSgst,
      totalIgst: totals.totalIgst,
      totalGst: totals.totalGst,
      roundOff: totals.roundOff,
      totalAmount: totals.totalAmount,
      amountInWords: totals.amountInWords,
      status: 'draft',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      balanceDue: totals.totalAmount,
      bankDetails: settings?.bankDetails || {
        bankName: 'IndusInd Bank',
        branch: 'Poojappura, Trivandrum Branch',
        accountNumber: '259447138617',
        ifscCode: 'INDB0001480',
        gpay: '9447138617'
      },
      notes,
      paymentTerms: paymentTerms || 'Immediate upon invoice submission'
    });

    res.status(201).json({ success: true, invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function issueInvoice(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (invoice.status === 'issued') {
      res.status(400).json({ success: false, message: 'Invoice is already issued.' });
      return;
    }

    // Date validation
    if (invoice.orderDate && invoice.invoiceDate) {
      const dateCheck = validateOrderInvoiceDates(invoice.orderDate, invoice.invoiceDate);
      if (!dateCheck.valid) {
        res.status(400).json({ success: false, message: dateCheck.error });
        return;
      }
    }

    // Generate atomic next official invoice number (e.g. DM/08/26-27)
    const { documentNumber, financialYear } = await getNextDocumentNumber(
      'invoice',
      invoice.invoiceDate
    );

    // Recalculate and verify totals
    const isInterState = Boolean(invoice.customer.stateCode && invoice.customer.stateCode !== '32');
    const calculatedItems = invoice.lineItems.map((item, idx) =>
      calculateLineItem({
        slNo: idx + 1,
        description: item.description,
        hsnSac: item.hsnSac || invoice.hsnCode || '998714',
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate, // BEFORE GST
        discountType: item.discountType,
        discountValue: item.discountValue,
        gstRate: item.gstRate,
        isInterState
      })
    );
    const totals = calculateDocumentTotals(calculatedItems);

    invoice.invoiceNumber = documentNumber;
    invoice.financialYear = financialYear;
    invoice.lineItems = calculatedItems;
    invoice.subtotalTaxable = totals.subtotalTaxable;
    invoice.totalCgst = totals.totalCgst;
    invoice.totalSgst = totals.totalSgst;
    invoice.totalIgst = totals.totalIgst;
    invoice.totalGst = totals.totalGst;
    invoice.totalAmount = totals.totalAmount;
    invoice.amountInWords = totals.amountInWords;
    invoice.balanceDue = totals.totalAmount - (invoice.amountPaid || 0);
    invoice.status = 'issued';
    invoice.issuedAt = new Date();
    invoice.issuedBy = req.user?.name || 'Admin';

    await invoice.save();

    // Update customer stats and vehicle/PO record
    if (invoice.customer.id) {
      const customer = await CustomerModel.findById(invoice.customer.id);
      if (customer) {
        customer.totalInvoiced = (customer.totalInvoiced || 0) + invoice.totalAmount;
        customer.outstandingBalance =
          (customer.outstandingBalance || 0) + invoice.balanceDue;

        if (invoice.vehicleNumber && !customer.vehicleNumbers.includes(invoice.vehicleNumber)) {
          customer.vehicleNumbers.push(invoice.vehicleNumber);
        }
        if (
          invoice.purchaseOrderNumber &&
          !customer.purchaseOrders.includes(invoice.purchaseOrderNumber)
        ) {
          customer.purchaseOrders.push(invoice.purchaseOrderNumber);
        }
        await customer.save();
      }
    }

    // Log Audit
    await AuditLogModel.create({
      action: 'ISSUE_INVOICE',
      resource: 'Invoice',
      resourceId: invoice._id.toString(),
      details: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        customerName: invoice.customer.name
      },
      performedBy: req.user?.name || 'Admin'
    });

    res.json({ success: true, invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateInvoice(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    if (invoice.status === 'issued') {
      res.status(400).json({
        success: false,
        message: 'Issued invoices cannot be directly modified. Create a revision or draft.'
      });
      return;
    }

    const {
      invoiceType,
      invoiceDate,
      orderDate,
      vehicleNumber,
      purchaseOrderNumber,
      customer,
      hsnCode,
      lineItems,
      notes,
      paymentTerms
    } = req.body;

    if (orderDate && invoiceDate) {
      const dateCheck = validateOrderInvoiceDates(orderDate, invoiceDate);
      if (!dateCheck.valid) {
        res.status(400).json({ success: false, message: dateCheck.error });
        return;
      }
    }

    const isInterState = Boolean(customer?.stateCode && customer.stateCode !== '32');
    const calculatedItems = (lineItems || invoice.lineItems).map((item: any, idx: number) =>
      calculateLineItem({
        slNo: idx + 1,
        description: item.description,
        hsnSac: item.hsnSac || hsnCode || '998714',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'Nos',
        rate: Number(item.rate) || 0, // BEFORE GST
        discountType: item.discountType || 'fixed',
        discountValue: Number(item.discountValue) || 0,
        gstRate: Number(item.gstRate) || 18,
        isInterState
      })
    );

    const totals = calculateDocumentTotals(calculatedItems);

    if (invoiceType) invoice.invoiceType = invoiceType;
    if (invoiceDate) invoice.invoiceDate = invoiceDate;
    if (orderDate !== undefined) invoice.orderDate = orderDate;
    if (vehicleNumber !== undefined) invoice.vehicleNumber = vehicleNumber.trim().toUpperCase();
    if (purchaseOrderNumber !== undefined) invoice.purchaseOrderNumber = purchaseOrderNumber.trim();
    if (customer) invoice.customer = customer;
    if (hsnCode) invoice.hsnCode = hsnCode;
    invoice.lineItems = calculatedItems;
    invoice.subtotalTaxable = totals.subtotalTaxable;
    invoice.totalCgst = totals.totalCgst;
    invoice.totalSgst = totals.totalSgst;
    invoice.totalIgst = totals.totalIgst;
    invoice.totalGst = totals.totalGst;
    invoice.totalAmount = totals.totalAmount;
    invoice.amountInWords = totals.amountInWords;
    invoice.balanceDue = totals.totalAmount - (invoice.amountPaid || 0);
    if (notes !== undefined) invoice.notes = notes;
    if (paymentTerms !== undefined) invoice.paymentTerms = paymentTerms;

    await invoice.save();
    res.json({ success: true, invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function previewInvoiceHtml(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      res.status(404).send('Invoice not found');
      return;
    }
    const settings = (await CompanySettingsModel.findOne()) || (new CompanySettingsModel() as any);
    const html = generateInvoiceHtml(invoice, settings);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}

export async function downloadInvoicePdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }
    const settings = (await CompanySettingsModel.findOne()) || (new CompanySettingsModel() as any);
    const html = generateInvoiceHtml(invoice, settings);
    const pdfBuffer = await renderPdfBuffer(html);

    const safeNumber = invoice.invoiceNumber.replace(/[\/\\]/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${safeNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
}
