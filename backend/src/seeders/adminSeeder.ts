import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { Role, RoleEnum } from '../models/Role';
import env from '../config/env';

const seedAdmin = async () => {
  await mongoose.connect(env.MONGODB_URI);

  const adminRole = await Role.findOne({ name: RoleEnum.ADMIN });
  if (!adminRole) {
    console.error('Admin role not found. Run role seeder first: npm run seed:roles');
    process.exit(1);
  }

  const existingAdmin = await User.findOne({ email: 'admin@aimarketlink.com' });
  if (existingAdmin) {
    console.log('Admin user already exists, skipping');
    await mongoose.disconnect();
    process.exit(0);
  }

  const adminPassword = env.ADMIN_PASSWORD || 'Admin@123456';
  const hashedPassword = await bcrypt.hash(adminPassword, env.JWT_SALT);

  await User.create({
    name: 'Super Admin',
    email: 'admin@yopmail.com',
    password: hashedPassword,
    isEmailVerified: true,
    roleId: adminRole._id
  });

  console.log('Admin user created successfully');

  await mongoose.disconnect();
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('Admin seeder failed:', err);
  process.exit(1);
});