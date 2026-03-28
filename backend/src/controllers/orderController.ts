import { Request, Response } from 'express';
import { createOrderSchema } from '../validations/orderValidator';
import OrderService from '../services/OrderService';
import { handleValidation } from '../middleware/validate';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(createOrderSchema, req.body);
    if (!data) return;

    const user = (req as any).user;
    const order = await OrderService.createOrder(user._id.toString(), data);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error: any) {
    throw error
  }
};


export const getBuyerOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orders = await OrderService.getBuyerOrders(user._id.toString());

    res.status(200).json({
      success: true,
      data: { orders },
    });
  } catch (error: any) {
    throw error
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const order = await OrderService.getOrderById(
      req.params.orderId as string,
      user._id.toString()
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    throw error
  }
};

export const getVendorOrders = async (req: Request, res: Response) => {
  try {
    const vendor = (req as any).vendor;

    const orders = await OrderService.getVendorOrders(
      vendor._id.toString()
    );

    res.status(200).json({
      success: true,
      data: { orders },
    });
  } catch (error: any) {
    throw error
  }
};

export const markShipped = async (req: Request, res: Response) => {
  try {
    const vendor = (req as any).vendor;

    const order = await OrderService.markShipped(
      req.params.orderId as string,
      vendor._id.toString()
    );

    res.status(200).json({
      success: true,
      message: 'Order marked as shipped',
      data: order,
    });
  } catch (error: any) {
    throw error
  }
};

export const markDelivered = async (req: Request, res: Response) => {
  try {
    const vendor = (req as any).vendor;

    const order = await OrderService.markDelivered(
      req.params.orderId as string,
      vendor._id.toString()
    );

    res.status(200).json({
      success: true,
      message: 'Order marked as delivered — awaiting buyer confirmation',
      data: order,
    });
  } catch (error: any) {
    throw error
  }
};

export const confirmDelivery = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const order = await OrderService.confirmDelivery(
      req.params.orderId as string,
      user._id.toString()
    );

    res.status(200).json({
      success: true,
      message: 'Delivery confirmed. Funds will be released to vendor.',
      data: order,
    });
  } catch (error: any) {
    throw error
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const user = (req as any).user;

    const requestingUserId = vendor
      ? vendor._id.toString()
      : user._id.toString();

    const order = await OrderService.cancelOrder(
      req.params.orderId as string,
      requestingUserId,
      vendor ? 'vendor' : 'buyer'
    );

    res.status(200).json({
      success: true,
      message: 'Order cancelled',
      data: order,
    });
  } catch (error: any) {
    throw error
  }
};