import { Request, Response } from 'express';
import { InvoiceModel } from '../models/Invoice';
import { QuotationModel } from '../models/Quotation';
import { PaymentModel } from '../models/Payment';
import { getFinancialYear } from '../shared';

export async function getFinancialReports(req: Request, res: Response): Promise<void> {
  try {
    const { financialYear } = req.query;
    const currentFy = getFinancialYear(new Date()).full;
    const targetFy = (financialYear as string) || currentFy;

    // GST Tax Summary
    const taxSummary = await InvoiceModel.aggregate([
      { $match: { status: 'issued', financialYear: targetFy } },
      {
        $group: {
          _id: null,
          totalTaxable: { $sum: '$subtotalTaxable' },
          totalCgst: { $sum: '$totalCgst' },
          totalSgst: { $sum: '$totalSgst' },
          totalIgst: { $sum: '$totalIgst' },
          totalGst: { $sum: '$totalGst' },
          grandTotal: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Sales by customer
    const customerSales = await InvoiceModel.aggregate([
      { $match: { status: 'issued', financialYear: targetFy } },
      {
        $group: {
          _id: '$customer.name',
          customerId: { $first: '$customer.id' },
          totalInvoiced: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { totalInvoiced: -1 } },
      { $limit: 10 }
    ]);

    // Quotation conversion rate
    const totalQuotations = await QuotationModel.countDocuments({ financialYear: targetFy });
    const convertedQuotations = await QuotationModel.countDocuments({
      financialYear: targetFy,
      status: 'converted'
    });
    const approvedQuotations = await QuotationModel.countDocuments({
      financialYear: targetFy,
      status: 'approved'
    });

    const conversionRate =
      totalQuotations > 0 ? Math.round((convertedQuotations / totalQuotations) * 100) : 0;

    res.json({
      success: true,
      taxSummary: taxSummary[0] || {
        totalTaxable: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalGst: 0,
        grandTotal: 0
      },
      customerSales,
      quotationStats: {
        total: totalQuotations,
        converted: convertedQuotations,
        approved: approvedQuotations,
        conversionRate
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
