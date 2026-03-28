import { Product, IProduct } from "../models/Product";
import VectorService from "../infrastructure/vector/VectorService";

class ProductService {
  async createProduct(productData: any, vendorId: string): Promise<IProduct> {
    const product = new Product({
      ...productData,
      vendor: vendorId,
    });

    await product.save();

    // TODO: add to queue
    // (async () => {
      try {
        const text = `${product.name} ${product.category} ${product.description} ₦${product.price}`;
        const embedding = await VectorService.generateEmbedding(text);

        // Update product with embedding
        await Product.findByIdAndUpdate(product._id, { embedding });
      } catch (error) {
        console.error(
          "Failed to generate embedding for product:",
          product._id,
          error,
        );
      }
    // })();

    // Return product without embedding
    const products = await Product.findById(product._id)
      .select("-embedding")
      .populate("vendor", "name email");
    if (!products) {
      throw new Error("Product not found");
    }

    return products;
  }

  async getAllProducts(
    page: number = 1,
    limit: number = 10,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-embedding")
        .populate("vendor", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(productId: string): Promise<IProduct | null> {
    return await Product.findById(productId)
      .select("-embedding")
      .populate("vendor", "businessName firstName lastName phoneNumber");
  }

  async bulkCreate(
    vendorId: string,
    items: Array<{
      imageUrl: string;
      name: string;
      category: string;
      price: number;
      quantity?: number;
    }>,
  ): Promise<{
    created: IProduct[];
    failed: Array<{ index: number; reason: string }>;
  }> {

    const results = await Promise.allSettled(
      items.map(async (item) => {
        const product = await Product.create({
          vendor: vendorId,
          name: item.name,
          description: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity ?? 0,
          imageUrl: item.imageUrl,
        });

        const text = `${product.name} ${product.category} ₦${product.price}`;
        VectorService.generateEmbedding(text)
          .then((embedding) =>
            Product.findByIdAndUpdate(product._id, { embedding }),
          )
          .catch((err) =>
            console.error("Embedding failed for product:", product._id, err),
          );

        return Product.findById(product._id).select(
          "-embedding",
        ) as Promise<IProduct>;
      }),
    );

    const created: IProduct[] = [];
    const failed: Array<{ index: number; reason: string }> = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        created.push(result.value);
      } else if (result.status === "rejected") {
        failed.push({
          index,
          reason: result.reason?.message ?? "Unknown error",
        });
      }
    });

    return { created, failed };
  }

  async updateProduct(
    productId: string,
    updateData: any,
    vendorId: string,
  ): Promise<IProduct | null> {
    const product = await Product.findOne({ _id: productId, vendor: vendorId });
    
    if (!product) {
      throw new Error("Product not found or access denied");
    }

    Object.assign(product, updateData);
    await product.save();

    // Regenerate embedding if relevant fields changed
    const relevantFieldsChanged = ["name", "description", "category"].some(
      (field) => field in updateData,
    );

    if (relevantFieldsChanged) {
      (async () => {
        try {
          const text = `${product.name} ${product.description} ${product.category}`;
          const embedding = await VectorService.generateEmbedding(text);

          // Update product with new embedding
          await Product.findByIdAndUpdate(product._id, { embedding });
        } catch (error) {
          console.error(
            "Failed to regenerate embedding for product:",
            product._id,
            error,
          );
        }
      })();
    }

    return await Product.findById(product._id)
      .select("-embedding")
      .populate("vendor", "name email");
  }

  async deleteProduct(productId: string, vendorId: string): Promise<boolean> {
    const result = await Product.deleteOne({
      _id: productId,
      vendor: vendorId,
    });
    return result.deletedCount > 0;
  }

  async getProductsByVendor(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ vendor: vendorId })
        .select("-embedding")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ vendor: vendorId }),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchProducts(
    queryText: string,
    limit: number = 10,
  ): Promise<IProduct[]> {
    return await VectorService.searchProducts(queryText, limit);
  }
}

export default new ProductService();
