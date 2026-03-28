import mongoose, { Document, Schema } from 'mongoose';
import { NotificationCategoryEnum } from '../interfaces/INotification';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  category: NotificationCategoryEnum;
  details?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: Object.values(NotificationCategoryEnum),
    required: true
  },
  details: {
    type: Schema.Types.Mixed,
    default: null
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ read: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);