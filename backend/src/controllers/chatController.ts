import { Request, Response } from 'express';
import { handleValidation } from '../middleware/validate';
import { chatSchema } from '../validations/chatValidator';
import ChatService from '../services/ChatService';

export const sendMessage = async (req: Request, res: Response) => {
  const { message } = handleValidation(chatSchema, req.body);
  const userId = (req as any).user._id;  
  const result = await ChatService.chat(userId, message);
  res.status(200).json({ success: true, data: result });
};

export const getChatHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const history = await ChatService.getHistory(userId);
  res.status(200).json({ success: true, data: history });
};

export const clearChatHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  await ChatService.clearHistory(userId);
  res.status(200).json({ success: true, message: 'Chat history cleared' });
};
