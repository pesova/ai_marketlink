import { Request, Response } from "express";
import VendorService from "../services/VendorService";
import {
  onboardSchema,
  updateBankDetailsSchema
} from "../validations/vendorValidator";
import { handleValidation } from "../middleware/validate";
import NinService from "../services/api/NinService";
import mongoose from "mongoose";
import { AuthService } from "../services";
import { User } from "../models";
import { formatKoboToNaira } from "../utils";

// For new users — no auth required
export const onboardVendor = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = handleValidation(onboardSchema, req.body);

    const ninVerification = await NinService.verifyNin({
      firstName: data.firstName,
      lastName: data.lastName,
      nin: data.nin,
    });

    if (!ninVerification.verified) {
      // await session.abortTransaction();
      // return res.status(400).json({
      //   success: false,
      //   message:
      //     ninVerification.message ||
      //     'NIN verification failed. Please check your NIN and name match your official records.',
      // });
    }

    await AuthService.register(
      {
        name: data.name!,
        email: data.email!,
        password: data.password!,
        phoneNumber: data.phoneNumber,
      },
      session,
    );

    const user = await User.findOne({ email: data.email }).session(session).exec();
    if (!user) throw new Error('Failed to create user account');

    const vendor = await VendorService.onboard(
      user._id.toString(),
      {
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        nin: data.nin,
        ninData: {
          applicant: ninVerification.data?.applicant,
          summary: ninVerification.data?.summary,
          status: ninVerification.data?.status,
        },
        phoneNumber: data.phoneNumber,
      },
      session,
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: 'Account and vendor profile created. Please verify your email.',
      data: { vendor, user },
    });
  } catch (error: any) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const onboardExistingVendor = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = handleValidation(onboardSchema, req.body);
    if (!data) {
      await session.abortTransaction();
      return;
    }

    const user = (req as any).user;

    const ninVerification = await NinService.verifyNin({
      firstName: data.firstName,
      lastName: data.lastName,
      nin: data.nin,
    });

    if (!ninVerification.verified) {
      // await session.abortTransaction();
      // return res.status(400).json({
      //   success: false,
      //   message:
      //     ninVerification.message ||
      //     'NIN verification failed. Please check your NIN and name match your official records.',
      // });
    }

    const vendor = await VendorService.onboard(
      user._id.toString(),
      {
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        nin: data.nin,
        ninData: {
          applicant: ninVerification.data?.applicant,
          summary: ninVerification.data?.summary,
          status: ninVerification.data?.status,
        },
        phoneNumber: data.phoneNumber,
      },
      session,
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Vendor profile created successfully.',
      data: { vendor, user }
    });

  } catch (error: any) {
    await session.abortTransaction();
    throw error
  } finally {
    session.endSession();
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;    
    const profile = await VendorService.getProfile(user._id);
    res.json({ success: true, data: profile });
  } catch (error: any) {
    throw error
  }
};


export const getProducts = async (req: Request, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const products = await VendorService.getProducts(vendor._id);
    res.json({ success: true, data: products });
  } catch (error: any) {
    throw error
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const orders = await VendorService.getOrders(vendor._id);
    res.json({ success: true, data: orders });
  } catch (error: any) {
    throw error
  }
};

export const getBalance = async (req: Request, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const { escrow, available } = await VendorService.getBalance(vendor._id);
    const balance = {
      escrow: formatKoboToNaira(escrow),
      available: formatKoboToNaira(available),
    };
    res.json({ success: true, data: balance });
  } catch (error: any) {
    throw error
  }
};

export const getPublicVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await VendorService.getPublicProfile(id as string);
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }
    res.json({ success: true, data: vendor });
  } catch (error: any) {
    throw error
  }
};

export const updateBankDetails = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(updateBankDetailsSchema, req.body);
    if (!data) return;
    const user = (req as any).user;
    const updated = await VendorService.updateBankDetails(user._id, data);
    res.json({ success: true, message: "Bank details updated", data: updated });
  } catch (error: any) {
    throw error;
  }
};
