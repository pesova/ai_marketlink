import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface IChatHistory extends Document {
  userId: Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatHistorySchema = new Schema<IChatHistory>(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

ChatHistorySchema.index({ userId: 1 });

export const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);
