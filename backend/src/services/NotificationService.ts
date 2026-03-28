import { Notification, INotification } from '../models/Notification';
import { mailConfig } from '../config/mail';
import mongoose from 'mongoose';
import { EmailTemplateEnum, SmtpProvider } from './SmtpProvider';
import { NotificationCategoryEnum, NotificationFilters } from '../interfaces/INotification';

class NotificationService {
  private fromValue: string = mailConfig.fromName;
  private emailProvider?: SmtpProvider;
  private dbPayload: Partial<{
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    category: NotificationCategoryEnum;
    details: Record<string, any>;
  }> = {};

  // reset state between uses
  private reset() {
    this.emailProvider = undefined;
    this.dbPayload = {};
  }

  public setFrom(value: string) {
    this.fromValue = value;
    if (this.emailProvider) this.emailProvider.from(value);
    return this;
  }

  public setTo(to: { userId?: mongoose.Types.ObjectId; email?: string }) {
    const { userId, email } = to;
    if (!this.emailProvider) this.emailProvider = new SmtpProvider();
    if (email) this.emailProvider.to(email);
    if (userId) this.dbPayload.userId = userId;
    return this;
  }

  public setSubject(subject: string) {
    if (!this.emailProvider) this.emailProvider = new SmtpProvider();
    this.emailProvider.subject(subject);
    this.dbPayload.title = subject;
    return this;
  }

  public setMessage(message: string) {
    if (!this.emailProvider) this.emailProvider = new SmtpProvider();
    this.emailProvider.text(message);
    this.emailProvider.html(`<p>${message}</p>`);
    this.dbPayload.message = message;
    return this;
  }

  public setCategory(category: NotificationCategoryEnum) {
    this.dbPayload.category = category;
    return this;
  }

  public setDetails(details: Record<string, any>) {
    this.dbPayload.details = details;
    return this;
  }

  public useTemplate(template: EmailTemplateEnum, data: Record<string, any>) {
    if (!this.emailProvider) this.emailProvider = new SmtpProvider();
    this.emailProvider.htmlView(template, data);
    return this;
  }

  public async sendViaEmail() {
    if (!this.emailProvider) {
      throw new Error('Email provider not initialized. Call setTo() or setSubject() first.');
    }
    this.emailProvider.from(this.fromValue);
    const result = await this.emailProvider.send();
    this.reset();
    return result;
  }

  public async sendToDB(): Promise<INotification | null> {
    const { userId, title, message, category } = this.dbPayload;

    if (!userId || !title || !message || !category) {
      throw new Error('userId, title, message and category are required to save notification.');
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      category,
      details: this.dbPayload.details,
      read: false
    });

    this.reset();
    return notification;
  }

  public async sendBoth(): Promise<void> {
    // Save a snapshot of payload before reset wipes it
    const payload = { ...this.dbPayload };
    const provider = this.emailProvider;

    // Send email
    if (provider) {
      provider.from(this.fromValue);
      await provider.send();
    }

    // Save to DB
    const { userId, title, message, category } = payload;
    if (userId && title && message && category) {
      await Notification.create({
        userId,
        title,
        message,
        category,
        details: payload.details,
        read: false
      });
    }

    this.reset();
  }

  // ── Query methods ──────────────────────────────────────────

  public async getAll(userId: mongoose.Types.ObjectId, filters: NotificationFilters) {
    const {
      category,
      read,
      search,
      limit = 20,
      offset = 0,
      order = 'newest'
    } = filters;

    const query: Record<string, any> = { userId };

    if (category) query.category = category;
    if (read !== undefined) query.read = read;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];

    const [data, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: order === 'newest' ? -1 : 1 })
        .skip(offset)
        .limit(limit),
      Notification.countDocuments(query)
    ]);

    return { meta: { total, offset, limit }, data };
  }

  public async countByStatus(userId: mongoose.Types.ObjectId, isRead: boolean) {
    return Notification.countDocuments({ userId, read: isRead });
  }

  public async getOne(notificationId: string, markRead = true): Promise<INotification> {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error('Notification not found');

    if (markRead && !notification.read) {
      notification.read = true;
      await notification.save();
    }

    return notification;
  }

  public async readAll(userId: mongoose.Types.ObjectId) {
    await Notification.updateMany({ userId, read: false }, { read: true });
    return true;
  }

  public async markSpecificAsRead(userId: mongoose.Types.ObjectId, ids: string[]) {
    if (!ids?.length) return [];

    await Notification.updateMany(
      { userId, _id: { $in: ids }, read: false },
      { read: true }
    );

    const updated = await Notification.find(
      { userId, _id: { $in: ids }, read: true },
      { _id: 1 }
    );

    return updated.map((n) => n._id.toString());
  }

  public async deleteMany(userId: mongoose.Types.ObjectId, ids: string[]) {
    if (!ids?.length) return [];
    await Notification.deleteMany({ userId, _id: { $in: ids } });
    return ids;
  }

  public async deleteAll(userId: mongoose.Types.ObjectId) {
    const result = await Notification.deleteMany({ userId });
    return result.deletedCount ?? 0;
  }
}

export default new NotificationService();