import mongoose from "mongoose";
import { IOrder } from "../models";

export type PopulatedOrder = Omit<IOrder, 'buyer' | 'vendor'> & {
  buyer: {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  vendor: {
    _id: mongoose.Types.ObjectId;
    businessName: string;
    user: {
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
    };
  };
};