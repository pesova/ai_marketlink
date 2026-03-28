import mongoose from 'mongoose';
import env from '../config/env';
import { Vendor } from '../models/Vendor';
import ProductService from '../services/ProductService';
import { ProductCategoryEnum } from '../interfaces/IProduct';

// Simple helper to pick a random enum value
const randomCategory = (): string => {
  const categories = Object.values(ProductCategoryEnum);
  return categories[Math.floor(Math.random() * categories.length)];
};

const productsData = [
  {
    name: 'Traditional Yoruba Hat',
    description: 'Handcrafted straw hat popular in Nigerian festivals.',
    price: 3500,
    category: ProductCategoryEnum.CLOTHING,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
  {
    name: 'African Print Shirt',
    description: 'Vibrant Ankara shirt made from 100% cotton.',
    price: 5500,
    category: ProductCategoryEnum.CLOTHING,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
  {
    name: 'Mobile Phone',
    description: 'Mid‑range Android smartphone with good camera.',
    price: 12000,
    category: ProductCategoryEnum.ELECTRONICS,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
  {
    name: 'Car Spare Part - Brake Pad',
    description: 'High‑quality brake pad for popular Nigerian car models.',
    price: 8000,
    category: ProductCategoryEnum.AUTOMOTIVE,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
  {
    name: 'Solar Lantern',
    description: 'Portable solar lantern, ideal for off‑grid power.',
    price: 3000,
    category: ProductCategoryEnum.HOME,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
  {
    name: 'Akara Snack Pack',
    description: 'Pack of 10 freshly fried bean cakes, a popular snack.',
    price: 2500,
    category: ProductCategoryEnum.GROCERIES,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
  {
    name: 'African Drum',
    description: 'Traditional talking drum used in cultural performances.',
    price: 7000,
    category: ProductCategoryEnum.TOYS,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
  {
    name: 'Health Supplement - Vitamin C',
    description: '500mg Vitamin C tablets for immune support.',
    price: 1500,
    category: ProductCategoryEnum.HEALTH,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
  {
    name: 'Sports Shoes',
    description: 'Comfortable running shoes for daily workouts.',
    price: 6500,
    category: ProductCategoryEnum.SPORTS,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
  {
    name: 'Beauty Cream',
    description: 'Moisturizing cream suitable for all skin types.',
    price: 4000,
    category: ProductCategoryEnum.BEAUTY,
    imageUrl: 'https://res.cloudinary.com/pesova/image/upload/v1774264464/ai-marketlink/products/hzlkeyo235mvbpn6gskh.png',
  },
];

const seedProducts = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected for product seeding');

  const vendor = await Vendor.findOne();
  if (!vendor) {
    console.error('No vendor found. Ensure at least one vendor exists before running product seeder.');
    process.exit(1);
  }

  for (const [index, prod] of productsData.entries()) {
    try {
      await ProductService.createProduct(
        {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          category: prod.category,
          quantity: 10,
          imageUrl: prod.imageUrl,
        },
        vendor._id.toString(),
      );
      console.log(`Created product ${index + 1}/${productsData.length}`);
    } catch (err) {
      console.error(`Failed to create product ${index + 1}:`, err);
    }
  }

  await mongoose.disconnect();
  console.log('Product seeding completed');
  process.exit(0);
};

seedProducts().catch((err) => {
  console.error('Product seeder encountered an error:', err);
  process.exit(1);
});
