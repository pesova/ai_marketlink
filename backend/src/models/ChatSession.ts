import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface IChatSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  messages: IMessage[];
  summary?: string | null;
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

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    messages: { type: [MessageSchema], default: [] },
    summary: { type: String, default: null },
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
