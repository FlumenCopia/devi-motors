import { Request, Response } from 'express';
import { QuotationModel } from '../models/Quotation';
import { InvoiceModel } from '../models/Invoice';
import { CompanySettingsModel } from '../models/CompanySettings';
import { AuditLogModel } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { getNextDocumentNumber, peekNextDocumentNumber } from '../services/counterService';
import { generateQuotationHtml, renderPdfBuffer } from '../services/pdfService';
import {
  calculateLineItem,
  calculateDocumentTotals,
  numberToIndianWords,
  getFinancialYear
} from '@devi-motors/shared';

export async function listQuotations(req: Request, res: Response): Promise<void> {
  try {
    const { search, type, status, customerId, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (type) filter.quotationType = type;
    if (status) filter.status = status;
    if (customerId) filter['customer.id'] = customerId;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { quotationNumber: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { vehicleProjectName: { $regex: q, $options: 'i' } },
        { serviceTitle: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [quotations, total] = await Promise.all([
      QuotationModel.find(filter)
        .sort({ quotationDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      QuotationModel.countDocuments(filter)
    ]);

    res.json({
      success: true,
      quotations,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getQuotation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quotation = await QuotationModel.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }
    res.json({ success: true, quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createQuotation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      quotationType = 'proposal_style',
      quotationDate,
      validUntil,
      customer,
      vehicleNumber,
      purchaseOrderNumber,
      vehicleProjectName,
      serviceTitle,
      narrativeDescription,
      serviceCharge = 0, // Rate before GST
      gstRate = 18,
      warranty,
      closingNote,
      lineItems
    } = req.body;

    const { documentNumber, financialYear } = await getNextDocumentNumber(
      'quotation',
      quotationDate
    );

    let subtotalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalGst = 0;
    let totalAmount = 0;
    let amountInWords = '';
    let processedLineItems: any[] = [];

    const isInterState = Boolean(customer?.stateCode && customer.stateCode !== '32');

    if (quotationType === 'proposal_style') {
      subtotalTaxable = Number(serviceCharge) || 0;
      const effectiveGstRate = Number(gstRate) || 18;
      totalGst = Math.round((subtotalTaxable * (effectiveGstRate / 100) + Number.EPSILON) * 100) / 100;
      totalAmount = subtotalTaxable + totalGst;
      if (isInterState) {
        totalIgst = totalGst;
      } else {
        totalCgst = Math.round((totalGst / 2 + Number.EPSILON) * 100) / 100;
        totalSgst = totalCgst;
      }
      amountInWords = numberToIndianWords(totalAmount);
    } else {
      processedLineItems = (lineItems || []).map((item: any, idx: number) =>
        calculateLineItem({
          slNo: idx + 1,
          description: item.description,
          hsnSac: item.hsnSac || '998714',
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'Nos',
          rate: Number(item.rate) || 0,
          discountType: item.discountType || 'fixed',
          discountValue: Number(item.discountValue) || 0,
          gstRate: Number(item.gstRate) || 18,
          isInterState
        })
      );
      const totals = calculateDocumentTotals(processedLineItems);
      subtotalTaxable = totals.subtotalTaxable;
      totalCgst = totals.totalCgst;
      totalSgst = totals.totalSgst;
      totalIgst = totals.totalIgst;
      totalGst = totals.totalGst;
      totalAmount = totals.totalAmount;
      amountInWords = totals.amountInWords;
    }

    const quotation = await QuotationModel.create({
      quotationType,
      quotationNumber: documentNumber,
      financialYear,
      quotationDate: quotationDate || new Date().toISOString().split('T')[0],
      validUntil,
      customer,
      vehicleNumber: vehicleNumber?.trim().toUpperCase(),
      purchaseOrderNumber: purchaseOrderNumber?.trim(),
      vehicleProjectName: vehicleProjectName?.trim(),
      serviceTitle: serviceTitle?.trim(),
      narrativeDescription,
      serviceCharge: Number(serviceCharge) || 0,
      warranty: warranty || 'We provide a 2-year warranty on the mirror polishing finish, subject to proper maintenance and care.',
      closingNote: closingNote || 'Thank you for choosing us, we look forward to giving your vehicle a flawless finish.',
      lineItems: processedLineItems,
      subtotalTaxable,
      gstRate: Number(gstRate) || 18,
      totalCgst,
      totalSgst,
      totalIgst,
      totalGst,
      totalAmount,
      amountInWords,
      status: 'pending'
    });

    await AuditLogModel.create({
      action: 'CREATE_QUOTATION',
      resource: 'Quotation',
      resourceId: quotation._id.toString(),
      details: {
        quotationNumber: quotation.quotationNumber,
        customerName: quotation.customer.name,
        totalAmount: quotation.totalAmount
      },
      performedBy: req.user?.name || 'Admin'
    });

    res.status(201).json({ success: true, quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateQuotation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quotation = await QuotationModel.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }

    Object.assign(quotation, req.body);
    await quotation.save();
    res.json({ success: true, quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateQuotationStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const quotation = await QuotationModel.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }

    quotation.status = status;
    await quotation.save();

    res.json({ success: true, quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function convertQuotationToInvoice(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quotation = await QuotationModel.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { documentNumber, financialYear } = await getNextDocumentNumber('invoice', today);
    const settings = await CompanySettingsModel.findOne();

    let lineItems = quotation.lineItems || [];
    if (quotation.quotationType === 'proposal_style') {
      lineItems = [
        calculateLineItem({
          slNo: 1,
          description: quotation.serviceTitle || quotation.vehicleProjectName || 'Automotive Service',
          quantity: 1,
          rate: quotation.serviceCharge || quotation.subtotalTaxable,
          gstRate: quotation.gstRate || 18,
          isInterState: Boolean(quotation.customer.stateCode && quotation.customer.stateCode !== '32')
        })
      ];
    }

    const totals = calculateDocumentTotals(lineItems);

    const invoice = await InvoiceModel.create({
      invoiceType: quotation.vehicleNumber ? 'vehicle' : 'client',
      invoiceNumber: documentNumber,
      financialYear,
      invoiceDate: today,
      vehicleNumber: quotation.vehicleNumber,
      purchaseOrderNumber: quotation.purchaseOrderNumber,
      customer: quotation.customer,
      hsnCode: '998714',
      lineItems,
      subtotalTaxable: totals.subtotalTaxable,
      totalCgst: totals.totalCgst,
      totalSgst: totals.totalSgst,
      totalIgst: totals.totalIgst,
      totalGst: totals.totalGst,
      roundOff: totals.roundOff,
      totalAmount: totals.totalAmount,
      amountInWords: totals.amountInWords,
      status: 'issued',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      balanceDue: totals.totalAmount,
      bankDetails: settings?.bankDetails,
      issuedAt: new Date(),
      issuedBy: req.user?.name || 'Admin',
      notes: `Converted from Quotation ${quotation.quotationNumber}`
    });

    quotation.status = 'converted';
    quotation.convertedInvoiceId = invoice._id.toString();
    quotation.convertedInvoiceNumber = invoice.invoiceNumber;
    await quotation.save();

    res.json({ success: true, invoice, quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function previewQuotationHtml(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quotation = await QuotationModel.findById(id);
    if (!quotation) {
      res.status(404).send('Quotation not found');
      return;
    }
    const settings = (await CompanySettingsModel.findOne()) || (new CompanySettingsModel() as any);
    const html = generateQuotationHtml(quotation, settings);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}

export async function downloadQuotationPdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const quotation = await QuotationModel.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found.' });
      return;
    }
    const settings = (await CompanySettingsModel.findOne()) || (new CompanySettingsModel() as any);
    const html = generateQuotationHtml(quotation, settings);
    const pdfBuffer = await renderPdfBuffer(html);

    const safeNumber = quotation.quotationNumber.replace(/[\/\\]/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Quotation-${safeNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Quotation PDF Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate Quotation PDF.' });
  }
}
