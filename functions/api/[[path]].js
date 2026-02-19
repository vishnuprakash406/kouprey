import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { initDb, dbAll, dbGet, dbRun } from '../_db.js';
import { jsonResponse, parseJson, readBody } from '../_utils.js';

const encoder = new TextEncoder();
const serverStartedAt = Date.now();
const errorLogs = [];

function getJwtSecret(env) {
  return env.JWT_SECRET || 'kouprey_dev_secret';
}

function getMasterCredentials(env) {
  return {
    email: env.MASTER_EMAIL || 'master@kouprey.com',
    password: env.MASTER_PASSWORD || 'ChangeMe123!',
  };
}

async function signToken(payload, env) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(encoder.encode(getJwtSecret(env)));
}

async function verifyToken(token, env) {
  const { payload } = await jwtVerify(token, encoder.encode(getJwtSecret(env)));
  return payload;
}

async function requireAuth(request, env, roles) {
  const header = request.headers.get('authorization') || '';
  const token = header.replace('Bearer ', '');
  if (!token) {
    return { response: jsonResponse({ error: 'Missing token' }, 401) };
  }

  try {
    const decoded = await verifyToken(token, env);
    if (!roles.includes(decoded.role)) {
      return { response: jsonResponse({ error: 'Insufficient role' }, 403) };
    }
    return { user: decoded };
  } catch {
    return { response: jsonResponse({ error: 'Invalid token' }, 401) };
  }
}

function normalizeProduct(row) {
  if (!row) return row;
  const images = parseJson(row.images, row.image ? [row.image] : []);
  const videos = parseJson(row.videos, []);
  return {
    ...row,
    sizes: row.sizes ? row.sizes.split(',').map((s) => s.trim()) : [],
    images,
    videos,
    color: row.color || '',
    rating: row.rating || 0,
    review_count: row.review_count || 0,
    subcategory: row.subcategory || '',
  };
}

function normalizeOrderItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    const parsed = parseJson(items, []);
    if (Array.isArray(parsed)) return parsed;
  }
  return [];
}

function makeUploadKey(originalName = 'file') {
  const safeName = String(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${suffix}-${safeName}`;
}

function buildPublicUrl(env, key) {
  const base = env.R2_PUBLIC_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/${key}`;
}

async function logEvent(env, level, message) {
  const entry = { time: new Date().toISOString(), level, message };
  errorLogs.push(entry);
  if (errorLogs.length > 50) errorLogs.shift();
  try {
    await dbRun(
      env,
      `INSERT INTO system_logs (level, message, created_at)
       VALUES (?, ?, ?)`,
      [level, message, entry.time]
    );
  } catch {
    // ignore log persistence errors
  }
}

function logError(env, message) {
  logEvent(env, 'error', message);
}

async function getTableNames(env) {
  const rows = await dbAll(
    env,
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  return rows.map((row) => row.name);
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const segments = path.split('/').filter(Boolean);
  const method = request.method.toUpperCase();

  try {
    await initDb(env);
  } catch (error) {
    return jsonResponse({ error: 'Database not available', detail: error.message }, 500);
  }

  if (segments[0] === 'health' && method === 'GET') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    const now = new Date();
    let dbStatus = 'ok';
    try {
      await dbGet(env, 'SELECT 1 as ok');
    } catch (error) {
      dbStatus = 'error';
      logError(env, `db: ${error.message}`);
    }

    let failedOrders = [];
    let logs = [];
    let lastPayuCallback = null;
    try {
      failedOrders = await dbAll(
        env,
        `SELECT id, customer_name, total, status, payment_status, created_at
         FROM orders
         WHERE payment_status != 'paid' OR status = 'failed'
         ORDER BY created_at DESC
         LIMIT 10`
      );
    } catch (error) {
      logError(env, `failedOrders: ${error.message}`);
    }

    try {
      logs = await dbAll(
        env,
        `SELECT level, message, created_at
         FROM system_logs
         ORDER BY id DESC
         LIMIT 50`
      );
      logs = logs.reverse();
    } catch (error) {
      logError(env, `systemLogs: ${error.message}`);
    }

    try {
      const lastPayu = await dbGet(
        env,
        "SELECT created_at FROM system_logs WHERE message LIKE 'payu_%' ORDER BY created_at DESC LIMIT 1"
      );
      lastPayuCallback = lastPayu?.created_at || null;
    } catch (error) {
      logError(env, `lastPayu: ${error.message}`);
    }

    return jsonResponse({
      status: 'ok',
      time: now.toISOString(),
      uptime_seconds: Math.floor((Date.now() - serverStartedAt) / 1000),
      database: dbStatus,
      last_payu_callback: lastPayuCallback,
      failed_orders: failedOrders,
      errors: logs.length
        ? logs.map((entry) => ({
            time: entry.created_at,
            level: entry.level,
            message: entry.message,
          }))
        : errorLogs.slice(-50),
    });
  }

  if (segments[0] === 'products' && method === 'GET') {
    if (segments.length === 1) {
      try {
        const rows = await dbAll(env, 'SELECT * FROM products ORDER BY updated_at DESC');
        return jsonResponse(rows.map(normalizeProduct));
      } catch {
        return jsonResponse({ error: 'Failed to load products' }, 500);
      }
    }

    if (segments.length === 2) {
      try {
        const product = await dbGet(env, 'SELECT * FROM products WHERE id = ?', [segments[1]]);
        if (!product) return jsonResponse({ error: 'Product not found' }, 404);
        return jsonResponse(normalizeProduct(product));
      } catch {
        return jsonResponse({ error: 'Failed to load product' }, 500);
      }
    }
  }

  if (segments[0] === 'products' && method === 'POST') {
    const auth = await requireAuth(request, env, ['store']);
    if (auth.response) return auth.response;

    const payload = await readBody(request);
    const {
      id,
      name,
      category,
      price,
      discount = 0,
      sizes = [],
      stock,
      availability,
      image,
      images = [],
      videos = [],
      color,
      subcategory,
      rating,
      review_count,
      description,
    } = payload;

    if (!name || !category || price == null || stock == null || !availability) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const productId = id || `kouprey-${String(Date.now()).slice(-6)}`;
    const now = new Date().toISOString();
    const numericStock = Number(stock);
    let computedAvailability = availability;
    if (numericStock <= 0) {
      computedAvailability = 'out_of_stock';
    } else if (numericStock < 10) {
      computedAvailability = 'low_stock';
    }

    try {
      await dbRun(
        env,
        `INSERT INTO products (id, name, category, subcategory, price, discount, sizes, stock, availability, image, images, videos, color, rating, review_count, description, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          name,
          category,
          subcategory || '',
          Number(price),
          Number(discount) || 0,
          Array.isArray(sizes) ? sizes.join(',') : String(sizes),
          numericStock,
          computedAvailability,
          image || (Array.isArray(images) && images[0]) || '',
          Array.isArray(images) ? JSON.stringify(images) : JSON.stringify(String(images).split(',')),
          Array.isArray(videos) ? JSON.stringify(videos) : JSON.stringify(String(videos).split(',')),
          color || '',
          Number(rating) || 0,
          Number(review_count) || 0,
          description || '',
          now,
        ]
      );

      const product = await dbGet(env, 'SELECT * FROM products WHERE id = ?', [productId]);
      return jsonResponse(normalizeProduct(product), 201);
    } catch (error) {
      if (String(error).includes('SQLITE_CONSTRAINT')) {
        return jsonResponse({ error: 'Product ID already exists' }, 409);
      }
      return jsonResponse({ error: 'Failed to create product' }, 500);
    }
  }

  if (segments[0] === 'products' && method === 'PUT' && segments.length === 2) {
    const auth = await requireAuth(request, env, ['store']);
    if (auth.response) return auth.response;

    const existing = await dbGet(env, 'SELECT * FROM products WHERE id = ?', [segments[1]]);
    if (!existing) return jsonResponse({ error: 'Product not found' }, 404);

    const payload = await readBody(request);
    const updated = { ...existing, ...payload };
    const numericStock = Number(updated.stock);
    let computedAvailability = updated.availability;
    if (numericStock <= 0) {
      computedAvailability = 'out_of_stock';
    } else if (numericStock < 10) {
      computedAvailability = 'low_stock';
    }

    try {
      await dbRun(
        env,
        `UPDATE products
         SET name = ?, category = ?, subcategory = ?, price = ?, discount = ?, sizes = ?, stock = ?, availability = ?, image = ?, images = ?, videos = ?, color = ?, rating = ?, review_count = ?, description = ?, updated_at = ?
         WHERE id = ?`,
        [
          updated.name,
          updated.category,
          updated.subcategory || '',
          Number(updated.price),
          Number(updated.discount) || 0,
          Array.isArray(updated.sizes) ? updated.sizes.join(',') : String(updated.sizes),
          numericStock,
          computedAvailability,
          updated.image || (Array.isArray(updated.images) && updated.images[0]) || '',
          Array.isArray(updated.images)
            ? JSON.stringify(updated.images)
            : JSON.stringify(String(updated.images || '').split(',').filter(Boolean)),
          Array.isArray(updated.videos)
            ? JSON.stringify(updated.videos)
            : JSON.stringify(String(updated.videos || '').split(',').filter(Boolean)),
          updated.color || '',
          Number(updated.rating) || 0,
          Number(updated.review_count) || 0,
          updated.description || '',
          new Date().toISOString(),
          segments[1],
        ]
      );

      const product = await dbGet(env, 'SELECT * FROM products WHERE id = ?', [segments[1]]);
      return jsonResponse(normalizeProduct(product));
    } catch {
      return jsonResponse({ error: 'Failed to update product' }, 500);
    }
  }

  if (segments[0] === 'products' && method === 'DELETE' && segments.length === 2) {
    const auth = await requireAuth(request, env, ['store']);
    if (auth.response) return auth.response;

    try {
      const product = await dbGet(env, 'SELECT * FROM products WHERE id = ?', [segments[1]]);
      if (!product) return jsonResponse({ error: 'Product not found' }, 404);
      await dbRun(env, 'DELETE FROM products WHERE id = ?', [segments[1]]);
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: 'Failed to delete product' }, 500);
    }
  }

  if (segments[0] === 'master' && segments[1] === 'login' && method === 'POST') {
    const { email, password } = await readBody(request);
    const master = getMasterCredentials(env);
    if (email === master.email && password === master.password) {
      const token = await signToken({ role: 'master', email }, env);
      return jsonResponse({ token });
    }
    return jsonResponse({ error: 'Invalid master credentials' }, 401);
  }

  if (segments[0] === 'master' && segments[1] === 'store-users' && method === 'POST') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    const { email, password } = await readBody(request);
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password required' }, 400);
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      await dbRun(
        env,
        `INSERT INTO store_users (email, password_hash, created_at)
         VALUES (?, ?, ?)`,
        [email, hash, new Date().toISOString()]
      );
      await dbRun(
        env,
        `INSERT INTO audit_logs (actor, action, target, detail, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          auth.user.email,
          'create_user',
          email,
          'Created store staff account',
          new Date().toISOString(),
        ]
      );
      return jsonResponse({ success: true }, 201);
    } catch (error) {
      if (String(error).includes('SQLITE_CONSTRAINT')) {
        return jsonResponse({ error: 'Store user already exists' }, 409);
      }
      return jsonResponse({ error: 'Failed to create store user' }, 500);
    }
  }

  if (segments[0] === 'master' && segments[1] === 'store-users' && method === 'GET') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    try {
      const users = await dbAll(env, 'SELECT email, created_at FROM store_users ORDER BY created_at DESC');
      return jsonResponse(users);
    } catch {
      return jsonResponse({ error: 'Failed to load store users' }, 500);
    }
  }

  if (segments[0] === 'master' && segments[1] === 'store-users' && segments[2] === 'reset' && method === 'POST') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    const { email, password } = await readBody(request);
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password required' }, 400);
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      await dbRun(env, 'UPDATE store_users SET password_hash = ? WHERE email = ?', [hash, email]);
      await dbRun(
        env,
        `INSERT INTO audit_logs (actor, action, target, detail, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          auth.user.email,
          'reset_password',
          email,
          'Reset staff password',
          new Date().toISOString(),
        ]
      );
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: 'Failed to reset password' }, 500);
    }
  }

  if (segments[0] === 'master' && segments[1] === 'store-users' && method === 'DELETE') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    const { email } = await readBody(request);
    if (!email) {
      return jsonResponse({ error: 'Email required' }, 400);
    }

    try {
      await dbRun(env, 'DELETE FROM store_users WHERE email = ?', [email]);
      await dbRun(
        env,
        `INSERT INTO audit_logs (actor, action, target, detail, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          auth.user.email,
          'delete_user',
          email,
          'Removed staff account',
          new Date().toISOString(),
        ]
      );
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: 'Failed to delete staff user' }, 500);
    }
  }

  if (segments[0] === 'master' && segments[1] === 'master-users' && method === 'POST') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    const { email, password } = await readBody(request);
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password required' }, 400);
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      await dbRun(
        env,
        `INSERT INTO master_users (email, password_hash, created_at)
         VALUES (?, ?, ?)`,
        [email, hash, new Date().toISOString()]
      );
      await dbRun(
        env,
        `INSERT INTO audit_logs (actor, action, target, detail, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          auth.user.email,
          'create_master',
          email,
          'Created master account',
          new Date().toISOString(),
        ]
      );
      return jsonResponse({ success: true }, 201);
    } catch (error) {
      if (String(error).includes('SQLITE_CONSTRAINT')) {
        return jsonResponse({ error: 'Master already exists' }, 409);
      }
      return jsonResponse({ error: 'Failed to create master' }, 500);
    }
  }

  if (segments[0] === 'master' && segments[1] === 'master-users' && method === 'GET') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    try {
      const users = await dbAll(env, 'SELECT email, created_at FROM master_users ORDER BY created_at DESC');
      return jsonResponse(users);
    } catch {
      return jsonResponse({ error: 'Failed to load master users' }, 500);
    }
  }

  if (segments[0] === 'master' && segments[1] === 'audit-logs' && method === 'GET') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    try {
      const logs = await dbAll(env, 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
      return jsonResponse(logs);
    } catch {
      return jsonResponse({ error: 'Failed to load audit logs' }, 500);
    }
  }

  if (segments[0] === 'master' && segments[1] === 'database' && method === 'GET') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    if (segments[2] === 'tables') {
      try {
        const tables = await getTableNames(env);
        return jsonResponse(tables);
      } catch {
        return jsonResponse({ error: 'Failed to load tables' }, 500);
      }
    }

    if (segments[2] === 'columns' && segments.length === 4) {
      try {
        const tables = await getTableNames(env);
        const table = segments[3];
        if (!tables.includes(table)) return jsonResponse({ error: 'Table not found' }, 404);
        const columns = await dbAll(env, `PRAGMA table_info(${table})`);
        return jsonResponse(columns);
      } catch {
        return jsonResponse({ error: 'Failed to load columns' }, 500);
      }
    }

    if (segments[2] === 'rows' && segments.length === 4) {
      try {
        const tables = await getTableNames(env);
        const table = segments[3];
        if (!tables.includes(table)) return jsonResponse({ error: 'Table not found' }, 404);
        const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);
        const rows = await dbAll(env, `SELECT rowid as __rowid, * FROM ${table} LIMIT ?`, [limit]);
        return jsonResponse(rows);
      } catch {
        return jsonResponse({ error: 'Failed to load rows' }, 500);
      }
    }
  }

  if (segments[0] === 'master' && segments[1] === 'database' && method === 'POST') {
    const auth = await requireAuth(request, env, ['master']);
    if (auth.response) return auth.response;

    if (segments[2] === 'insert' && segments.length === 4) {
      try {
        const tables = await getTableNames(env);
        const table = segments[3];
        if (!tables.includes(table)) return jsonResponse({ error: 'Table not found' }, 404);
        const payload = await readBody(request);
        const columns = Object.keys(payload);
        if (columns.length === 0) return jsonResponse({ error: 'No data provided' }, 400);
        const placeholders = columns.map(() => '?').join(',');
        const values = columns.map((col) => payload[col]);
        await dbRun(env, `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`, values);
        return jsonResponse({ success: true });
      } catch {
        return jsonResponse({ error: 'Failed to insert row' }, 500);
      }
    }

    if (segments[2] === 'update' && segments.length === 4) {
      try {
        const tables = await getTableNames(env);
        const table = segments[3];
        if (!tables.includes(table)) return jsonResponse({ error: 'Table not found' }, 404);
        const payload = await readBody(request);
        const { __rowid, ...data } = payload || {};
        if (!__rowid) return jsonResponse({ error: 'Missing row id' }, 400);
        const columns = Object.keys(data);
        if (columns.length === 0) return jsonResponse({ error: 'No data provided' }, 400);
        const sets = columns.map((col) => `${col} = ?`).join(', ');
        const values = columns.map((col) => data[col]);
        values.push(__rowid);
        await dbRun(env, `UPDATE ${table} SET ${sets} WHERE rowid = ?`, values);
        return jsonResponse({ success: true });
      } catch {
        return jsonResponse({ error: 'Failed to update row' }, 500);
      }
    }

    if (segments[2] === 'delete' && segments.length === 4) {
      try {
        const tables = await getTableNames(env);
        const table = segments[3];
        if (!tables.includes(table)) return jsonResponse({ error: 'Table not found' }, 404);
        const payload = await readBody(request);
        if (!payload?.__rowid) return jsonResponse({ error: 'Missing row id' }, 400);
        await dbRun(env, `DELETE FROM ${table} WHERE rowid = ?`, [payload.__rowid]);
        return jsonResponse({ success: true });
      } catch {
        return jsonResponse({ error: 'Failed to delete row' }, 500);
      }
    }

    if (segments[2] === 'query' && segments.length === 3) {
      const payload = await readBody(request);
      const sql = payload?.sql;
      if (!sql || typeof sql !== 'string') {
        return jsonResponse({ error: 'SQL is required' }, 400);
      }
      const trimmed = sql.trim();
      try {
        if (/^(select|pragma)\s/i.test(trimmed)) {
          const rows = await dbAll(env, trimmed);
          return jsonResponse({ rows });
        }
        await dbRun(env, trimmed);
        return jsonResponse({ success: true });
      } catch (error) {
        return jsonResponse({ error: 'Query failed', detail: String(error) }, 500);
      }
    }
  }

  if (segments[0] === 'store' && segments[1] === 'login' && method === 'POST') {
    const { email, password } = await readBody(request);
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password required' }, 400);
    }

    try {
      const user = await dbGet(env, 'SELECT * FROM store_users WHERE email = ?', [email]);
      if (!user) return jsonResponse({ error: 'Invalid store credentials' }, 401);

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return jsonResponse({ error: 'Invalid store credentials' }, 401);

      const token = await signToken({ role: 'store', email }, env);
      return jsonResponse({ token });
    } catch {
      return jsonResponse({ error: 'Failed to login' }, 500);
    }
  }

  if (segments[0] === 'orders' && method === 'GET') {
    if (segments.length === 1) {
      const auth = await requireAuth(request, env, ['store']);
      if (auth.response) return auth.response;

      try {
        const orders = await dbAll(env, 'SELECT * FROM orders ORDER BY created_at DESC');
        return jsonResponse(orders);
      } catch {
        return jsonResponse({ error: 'Failed to load orders' }, 500);
      }
    }

    if (segments.length === 2) {
      const auth = await requireAuth(request, env, ['store']);
      if (auth.response) return auth.response;

      try {
        const order = await dbGet(env, 'SELECT * FROM orders WHERE id = ?', [segments[1]]);
        if (!order) return jsonResponse({ error: 'Order not found' }, 404);
        const items = await dbAll(
          env,
          `SELECT oi.*, p.image, p.images
           FROM order_items oi
           LEFT JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = ?`,
          [segments[1]]
        );
        return jsonResponse({ ...order, items });
      } catch {
        return jsonResponse({ error: 'Failed to load order' }, 500);
      }
    }
  }

  if (segments[0] === 'orders' && segments[1] === 'track' && method === 'GET') {
    if (segments[2] === 'phone' && segments.length === 4) {
      try {
        const orders = await dbAll(
          env,
          'SELECT id, customer_name, customer_phone, total, status, payment_status, shipping_id, shipping_address, created_at FROM orders WHERE customer_phone = ? ORDER BY created_at DESC',
          [segments[3]]
        );
        return jsonResponse(orders);
      } catch {
        return jsonResponse({ error: 'Failed to track orders' }, 500);
      }
    }

    if (segments.length === 3) {
      try {
        const order = await dbGet(env, 'SELECT * FROM orders WHERE id = ?', [segments[2]]);
        if (!order) return jsonResponse({ error: 'Order not found' }, 404);
        return jsonResponse(order);
      } catch {
        return jsonResponse({ error: 'Failed to track order' }, 500);
      }
    }
  }

  if (segments[0] === 'orders' && method === 'PUT' && segments.length === 2) {
    const auth = await requireAuth(request, env, ['store']);
    if (auth.response) return auth.response;

    const payload = await readBody(request);
    let { status, shipping_id } = payload;
    if (!status) return jsonResponse({ error: 'Status required' }, 400);
    if (shipping_id && status !== 'delivered') {
      status = 'shipped';
    }

    try {
      await dbRun(env, 'UPDATE orders SET status = ?, shipping_id = ? WHERE id = ?', [
        status,
        shipping_id || '',
        segments[1],
      ]);
      return jsonResponse({ success: true });
    } catch {
      return jsonResponse({ error: 'Failed to update order' }, 500);
    }
  }

  if (segments[0] === 'orders' && method === 'POST' && segments.length === 1) {
    const payload = await readBody(request);
    let {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items = [],
      status = 'pending',
      payment_status = 'pending',
      payment_gateway,
      payu_txn_id,
    } = payload;

    items = normalizeOrderItems(items);

    if (!customer_name || !shipping_address || items.length === 0) {
      return jsonResponse({ error: 'Missing order details' }, 400);
    }

    const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const orderId = `ORD-${Date.now()}`;
    const createdAt = new Date().toISOString();

    try {
      await dbRun(
        env,
        `INSERT INTO orders (id, customer_name, customer_email, customer_phone, total, status, payment_status, payment_gateway, payu_txn_id, shipping_id, shipping_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          customer_name,
          customer_email || '',
          customer_phone || '',
          total,
          status,
          payment_status,
          payment_gateway || '',
          payu_txn_id || '',
          '',
          shipping_address,
          createdAt,
        ]
      );

      for (const item of items) {
        await dbRun(
          env,
          `INSERT INTO order_items (order_id, product_id, product_name, size, quantity, price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.product_name,
            item.size || '',
            Number(item.quantity),
            Number(item.price),
          ]
        );
      }

      return jsonResponse({ id: orderId }, 201);
    } catch {
      return jsonResponse({ error: 'Failed to create order' }, 500);
    }
  }

  if (segments[0] === 'uploads' && method === 'POST') {
    const auth = await requireAuth(request, env, ['store', 'master']);
    if (auth.response) return auth.response;

    if (!env.UPLOADS) {
      return jsonResponse({
        error: 'Uploads bucket not configured. Bind R2 as UPLOADS in Pages.',
      }, 501);
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return jsonResponse({ error: 'Expected multipart/form-data' }, 400);
    }

    const form = await request.formData();
    const files = form.getAll('files');
    if (!files.length) {
      return jsonResponse({ error: 'No files uploaded' }, 400);
    }

    const results = [];
    for (const entry of files) {
      if (!(entry instanceof File)) continue;
      const key = makeUploadKey(entry.name);
      const buffer = await entry.arrayBuffer();
      await env.UPLOADS.put(key, buffer, {
        httpMetadata: {
          contentType: entry.type || 'application/octet-stream',
        },
      });

      results.push({
        key,
        url: buildPublicUrl(env, key),
        type: entry.type || 'application/octet-stream',
      });
    }

    return jsonResponse({ files: results });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}
