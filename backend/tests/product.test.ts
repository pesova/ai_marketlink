import request from 'supertest';
import app from '../src/app';
import { ProductCategoryEnum } from '../src/interfaces/IProduct';
import {
  createProductForVendor,
  createVerifiedUser,
  createVendorForUser,
  signAccessToken,
} from './helpers/seed';

describe('GET /api/products', () => {
  it('returns paginated products', async () => {
    const res = await request(app).get('/api/products').query({ page: 1, limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.products).toBeDefined();
    expect(res.body.data?.totalPages).toBeGreaterThanOrEqual(0);
  });
});

describe('GET /api/products/search', () => {
  it('returns 400 when q is missing', async () => {
    const res = await request(app).get('/api/products/search');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Search query is required/i);
  });

  it('returns 200 with data when q provided', async () => {
    const res = await request(app).get('/api/products/search').query({ q: 'phone', limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/products/:id', () => {
  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/products/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Product not found/i);
  });

  it('returns product when found', async () => {
    const user = await createVerifiedUser({ email: `p-${Date.now()}@test.com` });
    const vendor = await createVendorForUser(user);
    const product = await createProductForVendor(vendor._id, { name: 'Listed Item' });
    const res = await request(app).get(`/api/products/${product._id.toString()}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.name).toBe('Listed Item');
  });
});

describe('Vendor product mutations', () => {
  async function vendorAgent() {
    const user = await createVerifiedUser({ email: `pv-${Date.now()}@test.com` });
    const vendor = await createVendorForUser(user);
    const token = signAccessToken(user);
    return { user, vendor, token };
  }

  it('POST /api/products returns 401 without auth', async () => {
    const res = await request(app).post('/api/products').field('name', 'X');
    expect(res.status).toBe(401);
  });

  it('POST /api/products returns 403 for buyer', async () => {
    const user = await createVerifiedUser({ email: `buy-${Date.now()}@test.com` });
    const token = signAccessToken(user);
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'X')
      .field('description', 'D')
      .field('price', '10')
      .field('category', ProductCategoryEnum.ELECTRONICS)
      .attach('image', Buffer.from('fake'), { filename: 'x.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(403);
  });

  it('POST /api/products returns 201 with image for vendor', async () => {
    const { vendor, token } = await vendorAgent();
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'USB Cable')
      .field('description', 'Good cable')
      .field('price', '25')
      .field('category', ProductCategoryEnum.ELECTRONICS)
      .attach('image', Buffer.from('fake'), { filename: 'cable.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.data?.name).toBe('USB Cable');
    expect(res.body.data?.vendor).toBeDefined();
  });

  it('POST /api/products returns 422 when image missing', async () => {
    const { token } = await vendorAgent();
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'No Image')
      .field('description', 'D')
      .field('price', '10')
      .field('category', ProductCategoryEnum.BOOKS);
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/image is required/i);
  });

  it('PUT /api/products/:id returns 422 on invalid body', async () => {
    const { vendor, token } = await vendorAgent();
    const product = await createProductForVendor(vendor._id);
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: -1 });
    expect(res.status).toBe(422);
  });

  it('PUT /api/products/:id updates product', async () => {
    const { vendor, token } = await vendorAgent();
    const product = await createProductForVendor(vendor._id, { name: 'Old' });
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', description: 'Updated', price: 50, category: ProductCategoryEnum.HOME });
    expect(res.status).toBe(200);
    expect(res.body.data?.name).toBe('New Name');
  });

  it('DELETE /api/products/:id removes product', async () => {
    const { vendor, token } = await vendorAgent();
    const product = await createProductForVendor(vendor._id);
    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);
  });

  it('GET /api/products/vendor/my-products lists vendor products', async () => {
    const { vendor, token } = await vendorAgent();
    await createProductForVendor(vendor._id, { name: 'Mine' });
    const res = await request(app)
      .get('/api/products/vendor/my-products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.products?.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/products/bulk returns 422 without images', async () => {
    const { token } = await vendorAgent();
    const res = await request(app)
      .post('/api/products/bulk')
      .set('Authorization', `Bearer ${token}`)
      .field('groupName', 'Group')
      .field('category', ProductCategoryEnum.TOYS)
      .field('price', '9.99')
      .field('quantity', '1');
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/At least one image/i);
  });

  it('POST /api/products/bulk creates products with images', async () => {
    const { token } = await vendorAgent();
    const res = await request(app)
      .post('/api/products/bulk')
      .set('Authorization', `Bearer ${token}`)
      .field('groupName', 'Bundle')
      .field('category', ProductCategoryEnum.SPORTS)
      .field('price', '15')
      .field('quantity', '2')
      .attach('images', Buffer.from('a'), { filename: 'a.jpg', contentType: 'image/jpeg' })
      .attach('images', Buffer.from('b'), { filename: 'b.jpg', contentType: 'image/jpeg' });

    expect([200, 201, 207]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.created?.length).toBeGreaterThanOrEqual(1);
  });
});
