import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import type { Db } from '../src/lib/prisma';

const SECRET = 'test-secret-test-secret-test-secret-123456';

export interface TestDb {
  db: Db;
  teardown: () => Promise<void>;
}

/** Los tests de la API. Reciben una base de datos lista para usar. */
export function defineApiTests(setup: () => Promise<TestDb>) {
  describe('Keepr API', () => {
    let server: Server;
    let base: string;
    let teardown: () => Promise<void>;
    let uploadsDir: string;

    before(async () => {
      const ctx = await setup();
      teardown = ctx.teardown;
      uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keepr-uploads-'));
      const app = createApp({ db: ctx.db, jwtSecret: SECRET, bcryptCost: 4, rateLimit: false, uploadsDir });
      server = app.listen(0);
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    after(async () => {
      server?.close();
      await teardown?.();
      if (uploadsDir) fs.rmSync(uploadsDir, { recursive: true, force: true });
    });

    async function call(method: string, path: string, opts: { token?: string; body?: unknown; raw?: string } = {}) {
      const res = await fetch(base + path, {
        method,
        headers: {
          ...(opts.body !== undefined || opts.raw !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        },
        body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      });
      const text = await res.text();
      return { status: res.status, json: text ? JSON.parse(text) : null };
    }

    async function register(email: string, name = 'Lucia Morales') {
      const r = await call('POST', '/auth/register', { body: { name, email, password: 'secret123' } });
      assert.equal(r.status, 201);
      return r.json as { token: string; user: { id: string } };
    }

    async function rawGet(p: string, token?: string) {
      const res = await fetch(base + p, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      return { status: res.status, type: res.headers.get('content-type'), bytes: Buffer.from(await res.arrayBuffer()) };
    }

    const filesInUploads = () => fs.readdirSync(uploadsDir).length;
    // Un JPEG mínimo: lo que se valida son los primeros bytes (FF D8 FF) y el tamaño.
    const jpeg = (fill = 7) =>
      Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.from('JFIF\0'), Buffer.alloc(200, fill), Buffer.from([0xff, 0xd9])]);

    const validProduct = {
      name: 'HP Victus 16',
      category: 'Tech',
      store: 'Fravega',
      purchaseDate: '2026-08-13',
      price: 1850000,
      warrantyExpiryDate: '2027-08-13',
    };

    it('responds to /health', async () => {
      const r = await call('GET', '/health');
      assert.equal(r.status, 200);
      assert.equal(r.json.status, 'ok');
    });

    it('rejects invalid registrations with per-field errors', async () => {
      const r = await call('POST', '/auth/register', { body: { name: 'L', email: 'nope', password: '123' } });
      assert.equal(r.status, 400);
      assert.ok(r.json.fields.name);
      assert.ok(r.json.fields.email);
      assert.ok(r.json.fields.password);
    });

    it('registers, never leaks the password hash, and rejects duplicate emails (case-insensitive)', async () => {
      const r = await call('POST', '/auth/register', {
        body: { name: 'Ana Perez', email: '  Ana@Email.com ', password: 'secret123' },
      });
      assert.equal(r.status, 201);
      assert.equal(r.json.user.email, 'ana@email.com');
      assert.equal(r.json.user.initial, 'A');
      assert.equal(r.json.user.plan, 'Keepr Free');
      assert.ok(r.json.token);
      assert.equal(JSON.stringify(r.json).includes('passwordHash'), false);

      const dup = await call('POST', '/auth/register', {
        body: { name: 'Ana 2', email: 'ANA@email.com', password: 'secret123' },
      });
      assert.equal(dup.status, 409);
    });

    it('logs in with the right password and gives the same error for wrong password and unknown email', async () => {
      await register('login@email.com');
      const ok = await call('POST', '/auth/login', { body: { email: 'LOGIN@email.com', password: 'secret123' } });
      assert.equal(ok.status, 200);
      assert.ok(ok.json.token);

      const wrong = await call('POST', '/auth/login', { body: { email: 'login@email.com', password: 'badpass' } });
      const unknown = await call('POST', '/auth/login', { body: { email: 'ghost@email.com', password: 'secret123' } });
      assert.equal(wrong.status, 401);
      assert.equal(unknown.status, 401);
      assert.equal(wrong.json.error, unknown.json.error);
    });

    it('protects /auth/me and /products', async () => {
      assert.equal((await call('GET', '/auth/me')).status, 401);
      assert.equal((await call('GET', '/products')).status, 401);

      const { token, user } = await register('me@email.com');
      const me = await call('GET', '/auth/me', { token });
      assert.equal(me.status, 200);
      assert.equal(me.json.user.id, user.id);

      assert.equal((await call('GET', '/auth/me', { token: token + 'x' })).status, 401);
      const expired = jwt.sign({}, SECRET, { subject: user.id, algorithm: 'HS256', expiresIn: -10 });
      assert.equal((await call('GET', '/auth/me', { token: expired })).status, 401);
      const forged = jwt.sign({}, 'another-secret-another-secret-12345678', { subject: user.id });
      assert.equal((await call('GET', '/auth/me', { token: forged })).status, 401);
    });

    it('creates a product with sensible defaults and an automatic purchase entry', async () => {
      const { token } = await register('create@email.com');
      const r = await call('POST', '/products', { token, body: validProduct });
      assert.equal(r.status, 201);
      const p = r.json.product;
      assert.equal(p.name, 'HP Victus 16');
      assert.equal(p.icon, '📱');
      assert.equal(p.subCategory, 'Tech');
      assert.equal(p.serialNumber, 'N/A');
      assert.equal(p.calendarEventId, undefined);
      assert.equal(p.documentation.length, 3);
      assert.equal(p.maintenanceHistory.length, 1);
      assert.equal(p.maintenanceHistory[0].type, 'purchase');
      assert.equal(p.maintenanceHistory[0].cost, 1850000);
      assert.equal(p.userId, undefined);
    });

    it('validates product input', async () => {
      const { token } = await register('invalid@email.com');
      const bad = async (patch: object) => (await call('POST', '/products', { token, body: { ...validProduct, ...patch } })).status;
      assert.equal(await bad({ name: '   ' }), 400);
      assert.equal(await bad({ price: 0 }), 400);
      assert.equal(await bad({ price: 10.5 }), 400);
      assert.equal(await bad({ category: 'Cars' }), 400);
      assert.equal(await bad({ purchaseDate: '2026-02-31' }), 400);
      assert.equal(await bad({ warrantyExpiryDate: '2026-08-13' }), 400);
      assert.equal(await bad({ warrantyExpiryDate: '2020-01-01' }), 400);
    });

    it('lists only the logged-in user products and hides other users products behind a 404', async () => {
      const a = await register('owner@email.com');
      const b = await register('stranger@email.com');
      const created = await call('POST', '/products', { token: a.token, body: validProduct });
      const id = created.json.product.id;

      assert.equal((await call('GET', '/products', { token: a.token })).json.products.length, 1);
      assert.equal((await call('GET', '/products', { token: b.token })).json.products.length, 0);

      assert.equal((await call('GET', `/products/${id}`, { token: b.token })).status, 404);
      assert.equal((await call('PATCH', `/products/${id}`, { token: b.token, body: { store: 'Hacked' } })).status, 404);
      assert.equal((await call('DELETE', `/products/${id}`, { token: b.token })).status, 404);
      assert.equal((await call('POST', `/products/${id}/maintenance`, {
        token: b.token,
        body: { date: '2026-09-01', title: 'x', type: 'maintenance' },
      })).status, 404);

      const still = await call('GET', `/products/${id}`, { token: a.token });
      assert.equal(still.json.product.store, 'Fravega');
    });

    it('updates a product, sets and clears calendarEventId, and checks dates against stored values', async () => {
      const { token } = await register('patch@email.com');
      const id = (await call('POST', '/products', { token, body: validProduct })).json.product.id;

      const store = await call('PATCH', `/products/${id}`, { token, body: { store: 'Garbarino' } });
      assert.equal(store.status, 200);
      assert.equal(store.json.product.store, 'Garbarino');
      assert.equal(store.json.product.name, 'HP Victus 16');
      assert.equal(store.json.product.serialNumber, 'N/A');

      const synced = await call('PATCH', `/products/${id}`, { token, body: { calendarEventId: 'evt-1' } });
      assert.equal(synced.json.product.calendarEventId, 'evt-1');
      const cleared = await call('PATCH', `/products/${id}`, { token, body: { calendarEventId: null } });
      assert.equal(cleared.json.product.calendarEventId, undefined);

      const earlier = await call('PATCH', `/products/${id}`, { token, body: { warrantyExpiryDate: '2026-01-01' } });
      assert.equal(earlier.status, 400);
      assert.ok(earlier.json.fields.warrantyExpiryDate);

      assert.equal((await call('PATCH', `/products/${id}`, { token, body: {} })).status, 400);
    });

    it('adds maintenance entries in date order and deletes products', async () => {
      const { token } = await register('maint@email.com');
      const id = (await call('POST', '/products', { token, body: validProduct })).json.product.id;

      await call('POST', `/products/${id}/maintenance`, {
        token,
        body: { date: '2027-03-14', title: 'Battery replacement', provider: 'iService', cost: 85000, type: 'maintenance' },
      });
      const r = await call('POST', `/products/${id}/maintenance`, {
        token,
        body: { date: '2026-12-20', title: 'Fan cleaning', type: 'maintenance' },
      });
      assert.equal(r.status, 201);
      assert.deepEqual(
        r.json.product.maintenanceHistory.map((m: { title: string }) => m.title),
        ['Product purchased', 'Fan cleaning', 'Battery replacement']
      );

      assert.equal((await call('DELETE', `/products/${id}`, { token })).status, 204);
      assert.equal((await call('GET', `/products/${id}`, { token })).status, 404);
    });

    it('uploads a receipt photo, serves the same bytes to its owner and nobody else', async () => {
      const owner = await register('photo-owner@email.com');
      const other = await register('photo-other@email.com');
      const created = (await call('POST', '/products', { token: owner.token, body: validProduct })).json.product;
      assert.equal(created.receiptPhotoId, undefined);
      assert.equal((await rawGet(`/products/${created.id}/receipt`, owner.token)).status, 404); // todavía sin foto

      const photo = jpeg();
      const up = await call('PUT', `/products/${created.id}/receipt`, { token: owner.token, body: { image: photo.toString('base64') } });
      assert.equal(up.status, 200);
      assert.match(up.json.product.receiptPhotoId, /^[0-9a-f-]{36}$/);
      assert.equal(JSON.stringify(up.json).includes('.jpg'), false); // no se filtra el nombre del archivo
      assert.equal(filesInUploads(), 1);

      const got = await rawGet(`/products/${created.id}/receipt`, owner.token);
      assert.equal(got.status, 200);
      assert.equal(got.type, 'image/jpeg');
      assert.ok(got.bytes.equals(photo));

      assert.equal((await rawGet(`/products/${created.id}/receipt`)).status, 401);
      assert.equal((await rawGet(`/products/${created.id}/receipt`, other.token)).status, 404);
      assert.equal((await call('PUT', `/products/${created.id}/receipt`, { token: other.token, body: { image: photo.toString('base64') } })).status, 404);
      assert.equal((await call('PUT', `/products/${created.id}/receipt`, { body: { image: photo.toString('base64') } })).status, 401);

      // La foto aparece al listar y al pedir el detalle
      assert.equal((await call('GET', '/products', { token: owner.token })).json.products.find((p: any) => p.id === created.id).receiptPhotoId, up.json.product.receiptPhotoId);
    });

    it('rejects photos that are not valid JPEGs or are too large', async () => {
      const { token } = await register('photo-invalid@email.com');
      const id = (await call('POST', '/products', { token, body: validProduct })).json.product.id;
      const put = (image: unknown) => call('PUT', `/products/${id}/receipt`, { token, body: { image } });
      const before = filesInUploads();

      assert.equal((await call('PUT', `/products/${id}/receipt`, { token, body: {} })).status, 400);
      assert.equal((await put('')).status, 400);
      assert.equal((await put('esto no es base64!!')).status, 400);
      assert.equal((await put('data:image/jpeg;base64,' + jpeg().toString('base64'))).status, 400);
      const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100)]);
      const notJpeg = await put(png.toString('base64'));
      assert.equal(notJpeg.status, 400);
      assert.deepEqual(notJpeg.json.fields.image, ['Only JPEG images are accepted.']);

      const tooBig = Buffer.concat([jpeg(), Buffer.alloc(5 * 1024 * 1024)]); // > 5 MB
      const big = await put(tooBig.toString('base64'));
      assert.equal(big.status, 400);
      assert.match(big.json.fields.image[0], /too large/);

      // Un cuerpo de más de 7 MB ni siquiera se lee
      assert.equal((await put('A'.repeat(8 * 1024 * 1024))).status, 413);
      assert.equal(filesInUploads(), before); // nada quedó guardado
    });

    it('replaces the photo (deleting the old file) and deletes it together with the product', async () => {
      const { token } = await register('photo-replace@email.com');
      const id = (await call('POST', '/products', { token, body: validProduct })).json.product.id;
      const start = filesInUploads();

      const first = await call('PUT', `/products/${id}/receipt`, { token, body: { image: jpeg(1).toString('base64') } });
      const second = await call('PUT', `/products/${id}/receipt`, { token, body: { image: jpeg(2).toString('base64') } });
      assert.notEqual(first.json.product.receiptPhotoId, second.json.product.receiptPhotoId);
      assert.equal(filesInUploads(), start + 1); // el archivo viejo se borró
      assert.ok((await rawGet(`/products/${id}/receipt`, token)).bytes.equals(jpeg(2)));

      assert.equal((await call('DELETE', `/products/${id}`, { token })).status, 204);
      assert.equal(filesInUploads(), start); // y al borrar el producto, también la foto
    });

    it('keeps rejecting big bodies on every other route', async () => {
      const r = await call('POST', '/auth/login', { body: { email: 'a@b.com', password: 'x'.repeat(200_000) } });
      assert.equal(r.status, 413);
    });

    it('answers malformed JSON with 400 and unknown routes with 404', async () => {
      const bad = await call('POST', '/auth/login', { raw: '{not json' });
      assert.equal(bad.status, 400);
      assert.equal((await call('GET', '/nope')).status, 404);
    });
  });
}
