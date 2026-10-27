import { Request, Response } from 'express';
import { CompanySettingsModel } from '../models/CompanySettings';
import { AuthRequest } from '../middleware/auth';

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    let settings = await CompanySettingsModel.findOne();
    if (!settings) {
      settings = await CompanySettingsModel.create({
        companyName: 'DEVI MOTORS',
        tagline: 'Professional Car Painting, Polishing & Detailing',
        addressLine1: 'T.C 17/2456-1, Opp.Rajiv Gandhi Centre for Bio Technology',
        addressLine2: 'Jagathy, Thycaud P.O, Thiruvananthapuram',
        state: 'Kerala',
        stateCode: '32',
        pinCode: '695014',
        phone: '9447138617',
        email: 'devi.motors.tvm@gmail.com',
        gstin: '32BAAPJ2054E1ZG',
        defaultHsn: '998714',
        bankDetails: {
          bankName: 'IndusInd Bank',
          branch: 'Poojappura, Trivandrum Branch',
          accountNumber: '259447138617',
          ifscCode: 'INDB0001480',
          gpay: '9447138617'
        },
        invoicePrefix: 'DM',
        quotationPrefix: 'DQ',
        defaultPaymentTerms: 'Immediate upon invoice submission',
        logoUrl: '/assets/logo.png',
        stampUrl: '/assets/stamp.jpg',
        signatureUrl: '/assets/signature.jpg'
      });
    }
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    let settings = await CompanySettingsModel.findOne();
    if (!settings) {
      settings = new CompanySettingsModel();
    }
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
