import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import env from '../../src/config/env';
import { Role, RoleEnum } from '../../src/models/Role';
import { User, IUser } from '../../src/models/User';
import { Vendor } from '../../src/models/Vendor';
import { Product } from '../../src/models/Product';
import { Order, OrderStatus } from '../../src/models/Order';
import { ProductCategoryEnum } from '../../src/interfaces/IProduct';

export async function seedRoles(): Promise<void> {
  await Role.insertMany([{ name: RoleEnum.USER }, { name: RoleEnum.ADMIN }]);
}

export async function createVerifiedUser(
  overrides: Partial<{ email: string; name: string; password: string }> = {},
): Promise<IUser> {
  const role = await Role.findOne({ name: RoleEnum.USER });
  if (!role) throw new Error('USER role missing — seedRoles() must run first');

  const password = overrides.password ?? 'Password123!';
  const hash = await bcrypt.hash(password, env.JWT_SALT);

  return User.create({
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `user-${Date.now()}@test.com`,
    password: hash,
    roleId: role._id,
    isEmailVerified: true,
  });
}

export async function createUnverifiedUser(): Promise<IUser> {
  const role = await Role.findOne({ name: RoleEnum.USER });
  if (!role) throw new Error('USER role missing');

  return User.create({
    name: 'Unverified',
    email: `unverified-${Date.now()}@test.com`,
    password: await bcrypt.hash('Password123!', env.JWT_SALT),
    roleId: role._id,
    isEmailVerified: false,
    emailVerificationToken: '123456',
  });
}

export async function createAdminUser(): Promise<IUser> {
  const role = await Role.findOne({ name: RoleEnum.ADMIN });
  if (!role) throw new Error('ADMIN role missing');

  return User.create({
    name: 'Admin User',
    email: `admin-${Date.now()}@test.com`,
    password: await bcrypt.hash('AdminPass123!', env.JWT_SALT),
    roleId: role._id,
    isEmailVerified: true,
  });
}

export function signAccessToken(user: IUser): string {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

export async function createVendorForUser(user: IUser): Promise<InstanceType<typeof Vendor>> {
  return Vendor.create({
    user: user._id,
    businessName: 'Test Biz',
    firstName: 'Jane',
    lastName: 'Vendor',
    nin: '12345678901',
    phoneNumber: '+2348000000000',
  });
}

export async function createProductForVendor(
  vendorId: Types.ObjectId,
  overrides: Partial<{ name: string; price: number; quantity: number }> = {},
) {
  return Product.create({
    name: overrides.name ?? 'Widget',
    description: 'A test product',
    price: overrides.price ?? 100,
    category: ProductCategoryEnum.ELECTRONICS,
    quantity: overrides.quantity ?? 10,
    imageUrl: 'https://example.com/p.jpg',
    vendor: vendorId,
  });
}

export async function createPendingOrder(
  buyer: IUser,
  vendorDoc: InstanceType<typeof Vendor>,
  product: InstanceType<typeof Product>,
) {
  return Order.create({
    buyer: buyer._id,
    vendor: vendorDoc._id,
    product: product._id,
    quantity: 1,
    unitPrice: product.price,
    totalAmount: product.price,
    deliveryAddress: '123 Test Street, Lagos',
    status: OrderStatus.PENDING_PAYMENT,
  });
}
