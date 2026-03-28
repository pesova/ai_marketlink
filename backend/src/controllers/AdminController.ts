import { Request, Response } from 'express';
import AdminService from '../services/AdminService';

export const getAllEscrows = async (req: Request, res: Response) => {
  try {
    const escrows = await AdminService.getAllEscrows();
    res.status(200).json({ success: true, data: escrows });
  } catch (error: any) {
    throw error;
  }
};

export const getVendorBalances = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const data = await AdminService.getVendorBalances(vendorId as string);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    throw error;
  }
};


export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await AdminService.getAllUsers(page, limit);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    throw error;
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await AdminService.getAllOrders(page, limit);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    throw error;
  }
};

export const getAllVendors = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await AdminService.getAllVendors(page, limit);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    throw error;
  }
};

export const resolveDispute = async (req: Request, res: Response) => {
  try {
    const { orderId, action } = req.body as { orderId: string; action: string };
    if (!orderId || !action) {
      return res.status(400).json({ success: false, message: 'orderId and action are required' });
    }
    await AdminService.resolveDispute(orderId, action);
    const verb = action === 'release' ? 'Released' : 'Refunded';
    res.status(200).json({ success: true, message: `${verb} escrow for order ${orderId}` });
  } catch (error: any) {
    throw error;
  }
};
