import { Request, Response } from 'express';
import { CustomerModel } from '../models/Customer';
import { InvoiceModel } from '../models/Invoice';
import { QuotationModel } from '../models/Quotation';

export async function listCustomers(req: Request, res: Response): Promise<void> {
  try {
    const { search, type, page = 1, limit = 50 } = req.query;
    const filter: any = { isArchived: false };

    if (type && type !== 'all') {
      filter.customerType = type;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { gstin: { $regex: q, $options: 'i' } },
        { vehicleNumbers: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      CustomerModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
      CustomerModel.countDocuments(filter)
    ]);

    res.json({
      success: true,
      customers,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    // Retrieve previous invoices and quotations
    const [invoices, quotations] = await Promise.all([
      InvoiceModel.find({ 'customer.id': id }).sort({ invoiceDate: -1 }),
      QuotationModel.find({ 'customer.id': id }).sort({ quotationDate: -1 })
    ]);

    res.json({
      success: true,
      customer,
      invoices,
      quotations
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      customerType,
      contactPerson,
      phone,
      email,
      billingAddress,
      state,
      stateCode,
      pinCode,
      gstin,
      notes,
      vehicleNumbers
    } = req.body;

    if (!name || !phone || !billingAddress) {
      res.status(400).json({
        success: false,
        message: 'Name, phone number, and billing address are required.'
      });
      return;
    }

    const customer = await CustomerModel.create({
      name: name.trim(),
      customerType: customerType || 'individual',
      contactPerson: contactPerson?.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      billingAddress: billingAddress.trim(),
      state: state || 'Kerala',
      stateCode: stateCode || '32',
      pinCode: pinCode?.trim(),
      gstin: gstin?.trim().toUpperCase(),
      notes,
      vehicleNumbers: vehicleNumbers || []
    });

    res.status(201).json({ success: true, customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }
    res.json({ success: true, customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function archiveCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }
    customer.isArchived = !customer.isArchived;
    await customer.save();
    res.json({ success: true, isArchived: customer.isArchived });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
