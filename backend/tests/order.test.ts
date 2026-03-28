import request from 'supertest';
import app from '../src/app';
import { Order, OrderStatus } from '../src/models/Order';
import {
  createPendingOrder,
  createProductForVendor,
  createVerifiedUser,
  createVendorForUser,
  signAccessToken,
} from './helpers/seed';

describe('/api/orders', () => {
  async function buyerAndVendorWithProduct() {
    const buyer = await createVerifiedUser({ email: `buy-${Date.now()}@test.com` });
    const sellerUser = await createVerifiedUser({ email: `sell-${Date.now()}@test.com` });
    const vendor = await createVendorForUser(sellerUser);
    const product = await createProductForVendor(vendor._id, { price: 50, quantity: 5 });
    return { buyer, sellerUser, vendor, product };
  }

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('POST / returns 422 on invalid body', async () => {
    const buyer = await createVerifiedUser({ email: `b-${Date.now()}@test.com` });
    const token = signAccessToken(buyer);
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: '', quantity: 0, deliveryAddress: 'ab' });
    expect(res.status).toBe(422);
  });

  it('POST / creates order', async () => {
    const { buyer, vendor, product } = await buyerAndVendorWithProduct();
    const token = signAccessToken(buyer);
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        quantity: 2,
        deliveryAddress: '12 Market Road, Lagos',
      });
    expect(res.status).toBe(201);
    expect(res.body.data?.totalAmount).toBe(product.price * 2);
    expect(res.body.data?.status).toBe(OrderStatus.PENDING_PAYMENT);
  });

  it('GET / lists buyer orders', async () => {
    const { buyer, vendor, product } = await buyerAndVendorWithProduct();
    const token = signAccessToken(buyer);
    await createPendingOrder(buyer, vendor, product);
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.orders?.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /:orderId returns order for buyer', async () => {
    const { buyer, vendor, product } = await buyerAndVendorWithProduct();
    const token = signAccessToken(buyer);
    const order = await createPendingOrder(buyer, vendor, product);
    const res = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data?._id || res.body.data?.id).toBeDefined();
  });

  it('GET /:orderId returns 500 when unauthorised', async () => {
    const { buyer, vendor, product } = await buyerAndVendorWithProduct();
    const other = await createVerifiedUser({ email: `other-${Date.now()}@test.com` });
    const order = await createPendingOrder(buyer, vendor, product);
    const res = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${signAccessToken(other)}`);
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/Unauthorised/i);
  });

  it('PATCH /:orderId/cancel allows buyer on PENDING_PAYMENT', async () => {
    const { buyer, vendor, product } = await buyerAndVendorWithProduct();
    const token = signAccessToken(buyer);
    const order = await createPendingOrder(buyer, vendor, product);
    const res = await request(app)
      .patch(`/api/orders/${order._id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.status).toBe(OrderStatus.CANCELLED);
  });

  it('PATCH /:orderId/confirm-delivery requires SHIPPED status', async () => {
    const { buyer, vendor, product } = await buyerAndVendorWithProduct();
    const token = signAccessToken(buyer);
    const order = await createPendingOrder(buyer, vendor, product);
    const res = await request(app)
      .patch(`/api/orders/${order._id}/confirm-delivery`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/Cannot confirm delivery/i);
  });

  it('PATCH /:orderId/ship returns 403 for buyer', async () => {
    const { buyer, vendor, product } = await buyerAndVendorWithProduct();
    const created = await createPendingOrder(buyer, vendor, product);
    await Order.findByIdAndUpdate(created._id, { status: OrderStatus.PAID_IN_ESCROW });

    const res = await request(app)
      .patch(`/api/orders/${created._id}/ship`)
      .set('Authorization', `Bearer ${signAccessToken(buyer)}`);
    expect(res.status).toBe(403);
  });

  it('PATCH /:orderId/ship marks shipped for vendor', async () => {
    const { buyer, vendor, product, sellerUser } = await buyerAndVendorWithProduct();
    const order = await createPendingOrder(buyer, vendor, product);
    await Order.findByIdAndUpdate(order._id, { status: OrderStatus.PAID_IN_ESCROW });

    const res = await request(app)
      .patch(`/api/orders/${order._id}/ship`)
      .set('Authorization', `Bearer ${signAccessToken(sellerUser)}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/shipped/i);
    expect(res.body.data?.status).toBe(OrderStatus.SHIPPED);
  });
});
