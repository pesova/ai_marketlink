import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordReset extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>({
  email: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema);