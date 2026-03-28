import mongoose from 'mongoose';
import { Role, RoleEnum } from '../models/Role';
import env from '../config/env';

const seedRoles = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected');

const roles = Object.values(RoleEnum);

  for (const name of roles) {
    const exists = await Role.findOne({ name });
    if (!exists) {
      await Role.create({ name });
      console.log(`Role '${name}' created`);
    } else {
      console.log(`Role '${name}' already exists, skipping`);
    }
  }

  console.log('Roles seeded successfully');
  await mongoose.disconnect();
  process.exit(0);
};

seedRoles().catch((err) => {
  console.error('Role seeder failed:', err);
  process.exit(1);
});