import request from 'supertest';
import app from '../src/app';
import InterswitchProvider from '../src/services/api/InterswitchProvider';
import { Order, OrderStatus } from '../src/models/Order';
import {
  createPendingOrder,
  createProductForVendor,
  createVerifiedUser,
  createVendorForUser,
  signAccessToken,
} from './helpers/seed';

describe('/api/payments', () => {
  async function buyerVendorProductOrder() {
    const buyer = await createVerifiedUser({ email: `pay-buy-${Date.now()}@test.com` });
    const seller = await createVerifiedUser({ email: `pay-sell-${Date.now()}@test.com` });
    const vendor = await createVendorForUser(seller);
    const product = await createProductForVendor(vendor._id, { price: 100, quantity: 3 });
    const order = await createPendingOrder(buyer, vendor, product);
    return { buyer, seller, vendor, product, order };
  }

  describe('Webhooks (no auth)', () => {
    it('GET /api/payments/webhook returns 400 without txnref', async () => {
      const res = await request(app).get('/api/payments/webhook');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/txnref is required/i);
    });

    it('GET /api/payments/webhook processes txnref', async () => {
      const { order } = await buyerVendorProductOrder();
      await Order.findByIdAndUpdate(order._id, {
        interswitchRef: 'WEBHOOK-REF-1',
        interswitchTransactionRef: 'WEBHOOK-REF-1',
      });

      const res = await request(app).get('/api/payments/webhook').query({ txnref: 'WEBHOOK-REF-1' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/payments/webhook delegates to GET handler', async () => {
      const { order } = await buyerVendorProductOrder();
      await Order.findByIdAndUpdate(order._id, {
        interswitchRef: 'WEBHOOK-REF-2',
      });

      const res = await request(app)
        .post('/api/payments/webhook')
        .send({ txnref: 'WEBHOOK-REF-2' });
      expect(res.status).toBe(200);
    });
  });

  describe('Authenticated payment routes', () => {
    it('POST /api/payments/initiate returns 401 without token', async () => {
      const res = await request(app).post('/api/payments/initiate').send({ orderId: 'x' });
      expect(res.status).toBe(401);
    });

    it('POST /api/payments/initiate returns 500 when orderId missing', async () => {
      const buyer = await createVerifiedUser({ email: `pi-${Date.now()}@test.com` });
      const res = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${signAccessToken(buyer)}`)
        .send({});
      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Order ID is required/i);
    });

    it('POST /api/payments/initiate creates payment link', async () => {
      const { buyer, order } = await buyerVendorProductOrder();
      const res = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${signAccessToken(buyer)}`)
        .send({ orderId: order._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.data?.paymentUrl).toBeDefined();
      expect(InterswitchProvider.createPaymentLink).toHaveBeenCalled();
    });

    it('GET /api/payments/escrow/:orderId returns 404 when escrow missing', async () => {
      const buyer = await createVerifiedUser({ email: `esc-${Date.now()}@test.com` });
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/payments/escrow/${fakeId}`)
        .set('Authorization', `Bearer ${signAccessToken(buyer)}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/No escrow record/i);
    });

    it('GET /api/payments/status validates query params', async () => {
      const buyer = await createVerifiedUser({ email: `st-${Date.now()}@test.com` });
      const res = await request(app)
        .get('/api/payments/status')
        .set('Authorization', `Bearer ${signAccessToken(buyer)}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/reference and amount are required/i);
    });

    it('GET /api/payments/status returns 400 when amount not numeric', async () => {
      const buyer = await createVerifiedUser({ email: `st2-${Date.now()}@test.com` });
      const res = await request(app)
        .get('/api/payments/status')
        .set('Authorization', `Bearer ${signAccessToken(buyer)}`)
        .query({ reference: 'REF', amount: 'abc' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/amount must be a number/i);
    });

    it('GET /api/payments/status verifies transaction', async () => {
      const buyer = await createVerifiedUser({ email: `st3-${Date.now()}@test.com` });
      const res = await request(app)
        .get('/api/payments/status')
        .set('Authorization', `Bearer ${signAccessToken(buyer)}`)
        .query({ reference: 'TX-REF', amount: '1000' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(InterswitchProvider.verifyTransaction).toHaveBeenCalled();
    });
  });
});
