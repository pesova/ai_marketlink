import mongoose, { Document, Schema } from 'mongoose';

export enum RoleEnum {
  USER = 'user',
  ADMIN = 'admin'
}

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId;
  name: RoleEnum;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>({
  name: {
    type: String,
    enum: Object.values(RoleEnum),
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

export const Role = mongoose.model<IRole>('Role', roleSchema);