import { Request, Response } from "express";
import ProductService from "../services/ProductService";
import {
  bulkCreateSchema,
  createProductSchema,
  updateProductSchema,
} from "../validations/productValidator";
import { handleValidation } from "../middleware/validate";
import upload, {
  deleteFromCloudinary,
  uploadManyToCloudinary,
  uploadToCloudinary,
} from "../infrastructure/upload/CloudinaryUpload";
import mongoose from "mongoose";

export const runSingleUpload = (req: Request, res: Response): Promise<void> => {
  return new Promise((resolve, reject) => {
    upload.single("image")(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const runArrayUpload = (
  req: Request,
  res: Response,
  maxCount = 20,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    upload.array("images", maxCount)(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const createProduct = async (req: Request, res: Response) => {
  let imageUrl;
  try {
    await runSingleUpload(req, res);
    const data = handleValidation(createProductSchema, req.body);
    const vendor = (req as any).vendor;

    if (!req.file) {
      return res
        .status(422)
        .json({ success: false, message: "Product image is required" });
    }
    imageUrl = await uploadToCloudinary(req.file.buffer);

    const product = await ProductService.createProduct(
      { ...data, imageUrl },
      vendor._id.toString(),
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error: any) {
    if (imageUrl) {
      deleteFromCloudinary(imageUrl).catch((err) =>
        console.error("Cloudinary rollback failed:", err),
      );
    }
    throw error;
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string | undefined;
    const minPrice = req.query.minPrice
      ? parseFloat(req.query.minPrice as string)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? parseFloat(req.query.maxPrice as string)
      : undefined;

    const result = await ProductService.getAllProducts(
      page,
      limit,
      category,
      minPrice,
      maxPrice,
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await ProductService.getProductById(
      req.params.id as string,
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const data = handleValidation(updateProductSchema, req.body);
    const vendor = (req as any).vendor;

    const product = await ProductService.updateProduct(
      req.params.id as string,
      data,
      vendor._id.toString(),
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error: any) {
    throw error
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const vendor = (req as any).vendor;

    const deleted = await ProductService.deleteProduct(
      req.params.id as string,
      vendor._id.toString(),
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByVendor = async (req: Request, res: Response) => {
  try {
    const vendor = (req as any).vendor;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await ProductService.getProductsByVendor(
      vendor._id.toString(),
      page,
      limit,
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }

    const products = await ProductService.searchProducts(q, limit);
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkCreateProducts = async (req: Request, res: Response) => {
  let imageUrls: string[] = [];
  try {
    await runArrayUpload(req, res);

    const files = req.files as Express.Multer.File[];

    // Step 2 — check files exist
    if (!files || files.length === 0) {
      return res
        .status(422)
        .json({ success: false, message: "At least one image is required" });
    }
    const data = handleValidation(bulkCreateSchema, req.body);    
    imageUrls = await uploadManyToCloudinary(files);
    
    const productIds = files.map(() => new mongoose.Types.ObjectId());    
    const vendor = (req as any).vendor;

    const items = files.map((_, index) => ({
      imageUrl: imageUrls[index],
      productId: productIds[index],
      name:
        files.length === 1 ? data.groupName : `${data.groupName} ${index + 1}`,
      category: data.category,
      price: data.price,
      quantity: data.quantity,
    }));

    const { created, failed } = await ProductService.bulkCreate(
      vendor._id.toString(),
      items,
    );

    // Rollback only failed images
    if (failed.length > 0) {
      const failedUrls = failed.map(({ index }) => imageUrls[index]);
      await Promise.allSettled(
        failedUrls.map((url) => deleteFromCloudinary(url)),
      );
    }

    const allFailed = created.length === 0;
    const someFailed = failed.length > 0 && created.length > 0;

    if (allFailed) {
      return res.status(400).json({
        success: false,
        message: "All products failed to create",
        data: { created: [], failed },
      });
    }

    return res.status(someFailed ? 207 : 201).json({
      success: true,
      message: `${created.length} of ${items.length} products created successfully`,
      data: { created, failed },
    });
  } catch (error: any) {    
    await Promise.allSettled(imageUrls.map((url) => deleteFromCloudinary(url)));
    throw error;
  }
};
