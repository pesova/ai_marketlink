import mongoose from 'mongoose';
import env from '../config/env';
import { Vendor } from '../models/Vendor';
import ProductService from '../services/ProductService';
import { ProductCategoryEnum } from '../interfaces/IProduct';

/** Verified Unsplash CDN (returns 200 as of seed authoring). */
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;

/** Verified Pexels CDN — some assets use .jpeg, others .jpg in path. */
const pexelsJpeg = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`;

const pexelsJpg = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800`;

const randomCategory = (): ProductCategoryEnum => {
  const categories = Object.values(ProductCategoryEnum);
  return categories[Math.floor(Math.random() * categories.length)]!;
};

type SeedRow = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

const productsRaw: SeedRow[] = [
  {
    name: 'Samsung Galaxy A05 (64GB)',
    description: '6.5" display, 5000mAh battery, dual SIM — everyday Android smartphone.',
    price: 118_000,
    imageUrl: unsplash('1511707171634-5f897ff02aa9'),
  },
  {
    name: 'Lenovo IdeaPad 1 (256GB SSD, 8GB RAM)',
    description: '15.6" laptop for work and study; Windows 11 ready.',
    price: 265_000,
    imageUrl: unsplash('1496181133206-80ce9b88a853'),
  },
  {
    name: 'Sony WH-CH520 Wireless Headphones',
    description: 'Bluetooth over-ear headphones with long battery life.',
    price: 48_500,
    imageUrl: unsplash('1505740420928-5e560c06d30e'),
  },
  {
    name: 'Canon EOS R100 Kit (18-45mm)',
    description: 'Mirrorless APS-C camera with starter zoom lens.',
    price: 685_000,
    imageUrl: unsplash('1516035069371-29a1b244cc32'),
  },
  {
    name: 'Nike Revolution 6 Running Shoes',
    description: 'Lightweight road running sneakers, breathable mesh upper.',
    price: 72_000,
    imageUrl: unsplash('1542291026-7eec264c27ff'),
  },
  {
    name: 'Unisex Plain Cotton T-Shirt (Pack of 3)',
    description: 'Soft crew-neck tees; black, white, grey — machine washable.',
    price: 19_500,
    imageUrl: unsplash('1521572163474-6864f9cf17ab'),
  },
  {
    name: 'Things Fall Apart — Chinua Achebe (Paperback)',
    description: 'Classic Nigerian novel; widely studied literature.',
    price: 4_800,
    imageUrl: unsplash('1544947950-fa07a98d237f'),
  },
  {
    name: 'The Ordinary Niacinamide 10% + Zinc 1%',
    description: 'Serum for oil control and clearer-looking skin; 30ml.',
    price: 18_000,
    imageUrl: unsplash('1556228720-195a672e8a03'),
  },
  {
    name: 'Hisense 55" 4K UHD Smart TV',
    description: 'HDR smart TV with streaming apps and HDMI ports.',
    price: 385_000,
    imageUrl: unsplash('1600585154340-be6161a56a0c'),
  },
  {
    name: '3-Seater Fabric Sofa (Grey)',
    description: 'Compact living-room sofa with removable cushion covers.',
    price: 195_000,
    imageUrl: unsplash('1556911220-bff31c812dba'),
  },
  {
    name: 'Wellwoman Multivitamin (30 tablets)',
    description: 'Daily vitamins and minerals tailored for women.',
    price: 12_500,
    imageUrl: unsplash('1584308666744-24d5c474f2ae'),
  },
  {
    name: 'Leather Tote Handbag (Brown)',
    description: 'Spacious shoulder bag with inner zip pocket.',
    price: 34_000,
    imageUrl: unsplash('1560472354-b33ff0c44a43'),
  },
  {
    name: 'Fresh Mixed Flower Bouquet',
    description: 'Seasonal blooms wrapped for delivery; colours may vary.',
    price: 22_000,
    imageUrl: unsplash('1607082349566-187342175e2f'),
  },
  {
    name: 'Ankara Shift Dress (Custom Fit)',
    description: 'Vibrant wax-print dress; dry-clean recommended.',
    price: 28_500,
    imageUrl: unsplash('1441986300917-64674bd600d8'),
  },
  {
    name: 'Strappy Block Heel Sandals',
    description: 'Comfortable mid-heel for events and office wear.',
    price: 24_000,
    imageUrl: unsplash('1523381210434-271e8be1f52b'),
  },
  {
    name: 'Adidas Grand Court Sneakers',
    description: 'Classic white leather-look sneakers with rubber sole.',
    price: 65_000,
    imageUrl: unsplash('1549298916-b41d501d3772'),
  },
  {
    name: 'Quilted Crossbody Bag (Saffiano-style)',
    description: 'Compact crossbody bag with adjustable strap and gold-tone hardware.',
    price: 42_000,
    imageUrl: unsplash('1553062407-98eeb64c6a62'),
  },
  {
    name: 'Leather Steering Wheel Cover (Universal 38cm)',
    description: 'Anti-slip grip; fits most sedans and SUVs.',
    price: 8_500,
    imageUrl: unsplash('1558618666-fcd25c85cd64'),
  },
  {
    name: 'Maybelline Fit Me Matte Foundation (120)',
    description: 'Liquid foundation for normal to oily skin; 30ml.',
    price: 14_200,
    imageUrl: unsplash('1522335789203-aabd1fc54bc9'),
  },
  {
    name: 'Adjustable Dumbbells 20kg Set',
    description: 'Pair with spin-lock collars for home workouts.',
    price: 55_000,
    imageUrl: unsplash('1571019613454-1cb2f99b2d8b'),
  },
  {
    name: 'Tempered Glass Screen Protector (2-pack)',
    description: '9H hardness; includes cleaning wipes — check phone model.',
    price: 5_500,
    imageUrl: unsplash('1541643600914-78b084683601'),
  },
  {
    name: 'Vintage Wash Denim Jacket',
    description: 'Unisex medium-weight jacket; metal button closure.',
    price: 31_000,
    imageUrl: unsplash('1445205170230-053b83016050'),
  },
  {
    name: 'Logitech M240 Silent Bluetooth Mouse',
    description: 'Compact wireless mouse; multi-device pairing.',
    price: 16_800,
    imageUrl: pexelsJpeg(1_092_644),
  },
  {
    name: 'Mechanical Gaming Keyboard (RGB)',
    description: 'Outemu-style switches; USB-C detachable cable.',
    price: 38_000,
    imageUrl: pexelsJpeg(788_946),
  },
  {
    name: 'Aluminum Laptop Stand (Adjustable)',
    description: 'Raises screen to eye level; fits 11–17" laptops.',
    price: 21_500,
    imageUrl: pexelsJpeg(356_056),
  },
  {
    name: 'Royal Umbrella Basmati Rice 5kg',
    description: 'Long-grain parboiled rice; store in a cool dry place.',
    price: 18_900,
    imageUrl: pexelsJpeg(265_087),
  },
  {
    name: 'Borges Extra Virgin Olive Oil 500ml',
    description: 'Cold-pressed; ideal for salads and light cooking.',
    price: 12_400,
    imageUrl: pexelsJpeg(265_667),
  },
  {
    name: 'LEGO Classic Creative Brick Box (484 pcs)',
    description: 'Assorted bricks and ideas booklet for ages 4+.',
    price: 45_000,
    imageUrl: pexelsJpeg(4_065_893),
  },
  {
    name: 'Hot Wheels 10-Car Gift Pack',
    description: 'Die-cast vehicles; styles vary by pack.',
    price: 22_500,
    imageUrl: pexelsJpeg(4_392_276),
  },
  {
    name: 'Fabric Resistance Bands Set (5 levels)',
    description: 'Loop bands for legs and glutes; includes carry bag.',
    price: 9_800,
    imageUrl: pexelsJpeg(4_041_392),
  },
  {
    name: 'Cast Iron Skillet 26cm (Pre-seasoned)',
    description: 'Heavy-duty pan for frying and baking; oven safe.',
    price: 28_000,
    imageUrl: pexelsJpeg(1_640_777),
  },
  {
    name: 'Stainless Steel Cookware Set (5-piece)',
    description: 'Pots with glass lids; induction compatible.',
    price: 62_000,
    imageUrl: pexelsJpeg(1_640_774),
  },
  {
    name: 'Non-Stick Frying Pan 28cm',
    description: 'Granite-style coating; soft handle grip.',
    price: 19_500,
    imageUrl: pexelsJpeg(1_640_770),
  },
  {
    name: 'Ceramic Dinner Plate Set (6 pieces)',
    description: 'Microwave-safe white plates for everyday dining.',
    price: 24_500,
    imageUrl: pexelsJpeg(1_640_768),
  },
  {
    name: 'Fresh Roma Tomatoes (Crates approx. 5kg)',
    description: 'Vine-ripened; ideal for stews and salads.',
    price: 7_200,
    imageUrl: pexelsJpeg(1_029_243),
  },
  {
    name: 'Ripe Plantain Bunch (Large)',
    description: 'Sweet frying plantains; perishables — consume within days.',
    price: 3_800,
    imageUrl: pexelsJpeg(298_863),
  },
  {
    name: 'Hollandia Evaporated Milk (48 x 50g sachets)',
    description: 'Tea and baking milk; wholesale-friendly pack.',
    price: 16_200,
    imageUrl: pexelsJpg(18_105),
  },
  {
    name: 'Golden Morn Maize Cereal 900g',
    description: 'Fortified family cereal; just add milk.',
    price: 5_600,
    imageUrl: pexelsJpg(34_153),
  },
  {
    name: 'JBL Flip 6 Portable Bluetooth Speaker',
    description: 'Waterproof IP67; up to 12h playtime (varies by volume).',
    price: 142_000,
    imageUrl: pexelsJpeg(7_679_860),
  },
  {
    name: 'Anker PowerCore 20000mAh Power Bank',
    description: 'USB-C and USB-A outputs; travel-friendly fast charging.',
    price: 32_000,
    imageUrl: pexelsJpeg(3_807_684),
  },
];

const productsData = productsRaw.map((p) => ({
  ...p,
  category: randomCategory(),
}));

const seedProducts = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected for product seeding');

  const vendor = await Vendor.findOne();
  if (!vendor) {
    console.error(
      'No vendor found. Ensure at least one vendor exists before running product seeder.',
    );
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
