import { Request, Response } from 'express';
import { InvoiceModel } from '../models/Invoice';
import { QuotationModel } from '../models/Quotation';
import { CustomerModel } from '../models/Customer';
import { PaymentModel } from '../models/Payment';
import { getFinancialYear } from '../shared';

export async function getDashboardMetrics(req: Request, res: Response): Promise<void> {
  try {
    const { financialYear } = req.query;
    const currentFy = getFinancialYear(new Date()).full;
    const targetFy = (financialYear as string) || currentFy;

    // Aggregations on issued invoices for target financial year
    const invoiceStats = await InvoiceModel.aggregate([
      { $match: { status: 'issued', financialYear: targetFy } },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balanceDue' }
        }
      }
    ]);

    const totalInvoiced = invoiceStats[0]?.totalInvoiced || 0;
    const totalPaid = invoiceStats[0]?.totalPaid || 0;
    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

    const quotationsPending = await QuotationModel.countDocuments({
      status: 'pending',
      financialYear: targetFy
    });

    // 12 Months breakdown: April to March for FY
    // e.g. 2026-2027: 2026-04 to 2027-03
    const [startYearStr, endYearStr] = targetFy.split('-');
    const startYr = parseInt(startYearStr, 10);
    const endYr = parseInt(endYearStr, 10);

    const monthNames = [
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
      'Jan',
      'Feb',
      'Mar'
    ];

    const monthlySales = await Promise.all(
      monthNames.map(async (name, index) => {
        const year = index < 9 ? startYr : endYr;
        const monthNum = index < 9 ? index + 4 : index - 8;
        const monthPad = String(monthNum).padStart(2, '0');
        const monthPrefix = `${year}-${monthPad}`;

        const [invRes, payRes] = await Promise.all([
          InvoiceModel.aggregate([
            {
              $match: {
                status: 'issued',
                invoiceDate: { $regex: `^${monthPrefix}` }
              }
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]),
          PaymentModel.aggregate([
            {
              $match: {
                paymentDate: { $regex: `^${monthPrefix}` }
              }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ])
        ]);

        return {
          month: name,
          invoiced: invRes[0]?.total || 0,
          paid: payRes[0]?.total || 0
        };
      })
    );

    // Recent documents (both Invoices and Quotations)
    const [recentInvoices, recentQuotations] = await Promise.all([
      InvoiceModel.find({ status: { $ne: 'draft' } })
        .sort({ invoiceDate: -1, createdAt: -1 })
        .limit(5),
      QuotationModel.find().sort({ quotationDate: -1, createdAt: -1 }).limit(5)
    ]);

    const combinedDocs = [
      ...recentInvoices.map((inv) => ({
        id: inv._id.toString(),
        type: 'invoice' as const,
        documentNumber: inv.invoiceNumber,
        customerName: inv.customer.name,
        date: inv.invoiceDate,
        amount: inv.totalAmount,
        status:
          inv.paymentStatus === 'paid'
            ? 'Paid'
            : inv.paymentStatus === 'partially_paid'
            ? 'Partially Paid'
            : 'Unpaid'
      })),
      ...recentQuotations.map((q) => ({
        id: q._id.toString(),
        type: 'quotation' as const,
        documentNumber: q.quotationNumber,
        customerName: q.customer.name,
        date: q.quotationDate,
        amount: q.totalAmount,
        status:
          q.status === 'approved'
            ? 'Approved'
            : q.status === 'pending'
            ? 'Pending'
            : q.status === 'converted'
            ? 'Converted'
            : q.status === 'rejected'
            ? 'Rejected'
            : 'Draft'
      }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Recent customers
    const recentCusts = await CustomerModel.find({ isArchived: false })
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentCustomers = recentCusts.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      customerType: c.customerType,
      gstin: c.gstin,
      lastActivity: `Customer updated ${new Date(c.updatedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })}`
    }));

    res.json({
      success: true,
      metrics: {
        totalInvoiced,
        totalPaid,
        outstandingBalance,
        quotationsPending,
        invoicedChangePercent: 12,
        paidChangePercent: 18,
        outstandingChangePercent: 5,
        quotationsChangePercent: -33,
        monthlySales,
        recentDocuments: combinedDocs,
        recentCustomers
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
