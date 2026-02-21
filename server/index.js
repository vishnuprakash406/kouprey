const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
let upload = null;
try {
  const multer = require('multer');
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  });
  upload = multer({ storage });
} catch (error) {
  console.warn('Multer not installed. Uploads are disabled.');
}
const { init, all, get, run } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const serverStartedAt = Date.now();
const errorLogs = [];
let lastPayuCallback = null;

const JWT_SECRET = process.env.JWT_SECRET || 'kouprey_dev_secret';
const MASTER_EMAIL = process.env.MASTER_EMAIL || 'master@kouprey.com';
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'ChangeMe123!';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

function logEvent(level, message) {
  const entry = { time: new Date().toISOString(), level, message };
  errorLogs.push(entry);
  if (errorLogs.length > 50) errorLogs.shift();
  run(
    `INSERT INTO system_logs (level, message, created_at)
     VALUES (?, ?, ?)`,
    [level, message, entry.time]
  ).catch(() => {});
}

function logError(message) {
  logEvent('error', message);
}

process.on('uncaughtException', (err) => {
  logEvent('error', `uncaughtException: ${err.stack || err.message || err}`);
});

process.on('unhandledRejection', (reason) => {
  logEvent('error', `unhandledRejection: ${reason?.stack || reason}`);
});

const nativeConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

console.log = (...args) => {
  nativeConsole.log(...args);
  logEvent('info', args.map(String).join(' '));
};
console.info = (...args) => {
  nativeConsole.info(...args);
  logEvent('info', args.map(String).join(' '));
};
console.warn = (...args) => {
  nativeConsole.warn(...args);
  logEvent('warn', args.map(String).join(' '));
};
console.error = (...args) => {
  nativeConsole.error(...args);
  logEvent('error', args.map(String).join(' '));
};

function authRole(role) {
  return authRoles([role]);
}

function authRoles(roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing token' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Insufficient role' });
      }
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

async function loadSettingsSnapshot() {
  const rows = await all('SELECT key, value FROM app_settings');
  const result = {};
  rows.forEach((row) => {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = null;
    }
  });
  return result;
}

async function saveSettingValue(key, value) {
  const payload = JSON.stringify(value ?? null);
  await run(
    `INSERT INTO app_settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, payload]
  );
}

app.get('/api/settings', async (req, res) => {
  try {
    const snapshot = await loadSettingsSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

app.put('/api/settings', authRole('master'), async (req, res) => {
  const payload = req.body || {};
  const keys = ['settings', 'theme', 'home', 'colors'];
  const updates = keys.filter((key) => Object.prototype.hasOwnProperty.call(payload, key));

  if (!updates.length) {
    return res.status(400).json({ error: 'No settings provided' });
  }

  try {
    for (const key of updates) {
      await saveSettingValue(key, payload[key]);
    }
    // Save cache version to bust browser cache
    const cacheVersion = Date.now();
    await saveSettingValue('cacheVersion', cacheVersion);
    res.json({ success: true, cacheVersion });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM products ORDER BY updated_at DESC');
    const products = rows.map((row) => ({
      ...row,
      sizes: row.sizes.split(',').map((s) => s.trim()),
      images: row.images ? JSON.parse(row.images) : row.image ? [row.image] : [],
      videos: row.videos ? JSON.parse(row.videos) : [],
      instagram_video: row.instagram_video || '',
      color: row.color || '',
      rating: row.rating || 0,
      review_count: row.review_count || 0,
      subcategory: row.subcategory || '',
    }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({
      ...product,
      sizes: product.sizes.split(',').map((s) => s.trim()),
      images: product.images ? JSON.parse(product.images) : product.image ? [product.image] : [],
      videos: product.videos ? JSON.parse(product.videos) : [],
      instagram_video: product.instagram_video || '',
      color: product.color || '',
      rating: product.rating || 0,
      review_count: product.review_count || 0,
      subcategory: product.subcategory || '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load product' });
  }
});

app.post('/api/products', authRole('store'), async (req, res) => {
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
    instagram_video,
    color,
    subcategory,
    rating,
    review_count,
    description,
  } = req.body;

  if (!name || !category || price == null || stock == null || !availability) {
    return res.status(400).json({ error: 'Missing required fields' });
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
    await run(
      `INSERT INTO products (id, name, category, subcategory, price, discount, sizes, stock, availability, image, images, videos, instagram_video, color, rating, review_count, description, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    , [
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
      instagram_video || '',
      color || '',
      Number(rating) || 0,
      Number(review_count) || 0,
      description || '',
      now,
    ]);

    const product = await get('SELECT * FROM products WHERE id = ?', [productId]);
    res.status(201).json({
      ...product,
      sizes: product.sizes.split(',').map((s) => s.trim()),
      subcategory: product.subcategory || '',
    });
  } catch (error) {
    if (String(error).includes('SQLITE_CONSTRAINT')) {
      return res.status(409).json({ error: 'Product ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', authRole('store'), async (req, res) => {
  const { id } = req.params;
  const existing = await get('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const updated = {
    ...existing,
    ...req.body,
  };
  const numericStock = Number(updated.stock);
  let computedAvailability = updated.availability;
  if (numericStock <= 0) {
    computedAvailability = 'out_of_stock';
  } else if (numericStock < 10) {
    computedAvailability = 'low_stock';
  }

  try {
    await run(
      `UPDATE products
       SET name = ?, category = ?, subcategory = ?, price = ?, discount = ?, sizes = ?, stock = ?, availability = ?, image = ?, images = ?, videos = ?, instagram_video = ?, color = ?, rating = ?, review_count = ?, description = ?, updated_at = ?
       WHERE id = ?`
    , [
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
      updated.instagram_video || '',
      updated.color || '',
      Number(updated.rating) || 0,
      Number(updated.review_count) || 0,
      updated.description || '',
      new Date().toISOString(),
      id,
    ]);

    const product = await get('SELECT * FROM products WHERE id = ?', [id]);
    res.json({
      ...product,
      sizes: product.sizes.split(',').map((s) => s.trim()),
      subcategory: product.subcategory || '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authRole('store'), async (req, res) => {
  const { id } = req.params;
  try {
    const product = await get('SELECT * FROM products WHERE id = ?', [id]);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const media = [];
    const images = product.images ? JSON.parse(product.images) : [];
    const videos = product.videos ? JSON.parse(product.videos) : [];
    if (product.image) media.push(product.image);
    media.push(...images, ...videos);

    for (const item of media) {
      if (typeof item === 'string' && item.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', 'public', item);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {
            // ignore delete errors
          }
        }
      }
    }

    await run('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.post('/api/master/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const user = await get('SELECT * FROM master_users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid master credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid master credentials' });
    const token = signToken({ role: 'master', email });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/master/store-users', authRole('master'), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await run(
      `INSERT INTO store_users (email, password_hash, created_at)
       VALUES (?, ?, ?)`
    , [email, hash, new Date().toISOString()]);
    await run(
      `INSERT INTO audit_logs (actor, action, target, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    , [
      req.user.email,
      'create_user',
      email,
      'Created store staff account',
      new Date().toISOString(),
    ]);
    res.status(201).json({ success: true });
  } catch (error) {
    if (String(error).includes('SQLITE_CONSTRAINT')) {
      return res.status(409).json({ error: 'Store user already exists' });
    }
    res.status(500).json({ error: 'Failed to create store user' });
  }
});

app.get('/api/master/store-users', authRole('master'), async (req, res) => {
  try {
    const users = await all('SELECT email, created_at FROM store_users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load store users' });
  }
});

app.post('/api/master/store-users/reset', authRole('master'), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await run('UPDATE store_users SET password_hash = ? WHERE email = ?', [hash, email]);
    await run(
      `INSERT INTO audit_logs (actor, action, target, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    , [
      req.user.email,
      'reset_password',
      email,
      'Reset staff password',
      new Date().toISOString(),
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

app.delete('/api/master/store-users', authRole('master'), async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  try {
    await run('DELETE FROM store_users WHERE email = ?', [email]);
    await run(
      `INSERT INTO audit_logs (actor, action, target, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    , [
      req.user.email,
      'delete_user',
      email,
      'Removed staff account',
      new Date().toISOString(),
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete staff user' });
  }
});

app.post('/api/master/master-users', authRole('master'), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await run(
      `INSERT INTO master_users (email, password_hash, created_at)
       VALUES (?, ?, ?)`
    , [email, hash, new Date().toISOString()]);
    await run(
      `INSERT INTO audit_logs (actor, action, target, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    , [
      req.user.email,
      'create_master',
      email,
      'Created master account',
      new Date().toISOString(),
    ]);
    res.status(201).json({ success: true });
  } catch (error) {
    if (String(error).includes('SQLITE_CONSTRAINT')) {
      return res.status(409).json({ error: 'Master already exists' });
    }
    res.status(500).json({ error: 'Failed to create master' });
  }
});

app.get('/api/master/master-users', authRole('master'), async (req, res) => {
  try {
    const users = await all('SELECT email, created_at FROM master_users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load master users' });
  }
});

app.get('/api/master/audit-logs', authRole('master'), async (req, res) => {
  try {
    const logs = await all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

async function getTableNames() {
  const rows = await all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  return rows.map((row) => row.name);
}

app.get('/api/master/database/tables', authRole('master'), async (req, res) => {
  try {
    const tables = await getTableNames();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load tables' });
  }
});

app.get('/api/master/database/columns/:table', authRole('master'), async (req, res) => {
  try {
    const tables = await getTableNames();
    const table = req.params.table;
    if (!tables.includes(table)) return res.status(404).json({ error: 'Table not found' });
    const columns = await all(`PRAGMA table_info(${table})`);
    res.json(columns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load columns' });
  }
});

app.get('/api/master/database/rows/:table', authRole('master'), async (req, res) => {
  try {
    const tables = await getTableNames();
    const table = req.params.table;
    if (!tables.includes(table)) return res.status(404).json({ error: 'Table not found' });
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await all(`SELECT rowid as __rowid, * FROM ${table} LIMIT ?`, [limit]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load rows' });
  }
});

app.post('/api/master/database/insert/:table', authRole('master'), async (req, res) => {
  try {
    const tables = await getTableNames();
    const table = req.params.table;
    if (!tables.includes(table)) return res.status(404).json({ error: 'Table not found' });
    const payload = req.body || {};
    const columns = Object.keys(payload);
    if (columns.length === 0) return res.status(400).json({ error: 'No data provided' });
    const placeholders = columns.map(() => '?').join(',');
    const values = columns.map((col) => payload[col]);
    await run(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`, values);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to insert row' });
  }
});

app.post('/api/master/database/update/:table', authRole('master'), async (req, res) => {
  try {
    const tables = await getTableNames();
    const table = req.params.table;
    if (!tables.includes(table)) return res.status(404).json({ error: 'Table not found' });
    const { __rowid, ...payload } = req.body || {};
    if (!__rowid) return res.status(400).json({ error: 'Missing row id' });
    const columns = Object.keys(payload);
    if (columns.length === 0) return res.status(400).json({ error: 'No data provided' });
    const sets = columns.map((col) => `${col} = ?`).join(', ');
    const values = columns.map((col) => payload[col]);
    values.push(__rowid);
    await run(`UPDATE ${table} SET ${sets} WHERE rowid = ?`, values);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update row' });
  }
});

app.post('/api/master/database/delete/:table', authRole('master'), async (req, res) => {
  try {
    const tables = await getTableNames();
    const table = req.params.table;
    if (!tables.includes(table)) return res.status(404).json({ error: 'Table not found' });
    const { __rowid } = req.body || {};
    if (!__rowid) return res.status(400).json({ error: 'Missing row id' });
    await run(`DELETE FROM ${table} WHERE rowid = ?`, [__rowid]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete row' });
  }
});

app.post('/api/master/database/query', authRole('master'), async (req, res) => {
  const { sql } = req.body || {};
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'SQL is required' });
  }
  const trimmed = sql.trim();
  try {
    if (/^(select|pragma)\s/i.test(trimmed)) {
      const rows = await all(trimmed);
      return res.json({ rows });
    }
    await run(trimmed);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Query failed', detail: String(error) });
  }
});

app.post('/api/store/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await get('SELECT * FROM store_users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid store credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid store credentials' });

    const token = signToken({ role: 'store', email });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/orders', authRole('store'), async (req, res) => {
  try {
    const orders = await all('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

app.get('/api/orders/:id', authRole('store'), async (req, res) => {
  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const items = await all(
      `SELECT oi.*, p.image, p.images
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );
    res.json({ ...order, items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load order' });
  }
});

app.get('/api/orders/track/:id', async (req, res) => {
  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to track order' });
  }
});

app.get('/api/orders/track/phone/:phone', async (req, res) => {
  try {
    const orders = await all(
      'SELECT id, customer_name, customer_phone, total, status, payment_status, shipping_id, shipping_address, created_at FROM orders WHERE customer_phone = ? ORDER BY created_at DESC',
      [req.params.phone]
    );
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to track orders' });
  }
});

app.put('/api/orders/:id', authRole('store'), async (req, res) => {
  let { status, shipping_id } = req.body;
  if (!status) return res.status(400).json({ error: 'Status required' });
  if (shipping_id && status !== 'delivered') {
    status = 'shipped';
  }
  try {
    await run('UPDATE orders SET status = ?, shipping_id = ? WHERE id = ?', [
      status,
      shipping_id || '',
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.post('/api/orders', async (req, res) => {
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
  } = req.body;

  if (!customer_name || !shipping_address || items.length === 0) {
    return res.status(400).json({ error: 'Missing order details' });
  }

  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const orderId = `ORD-${Date.now()}`;
  const createdAt = new Date().toISOString();

  try {
    await run(
      `INSERT INTO orders (id, customer_name, customer_email, customer_phone, total, status, payment_status, payment_gateway, payu_txn_id, shipping_id, shipping_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    , [
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
    ]);

    for (const item of items) {
      await run(
        `INSERT INTO order_items (order_id, product_id, product_name, size, quantity, price)
         VALUES (?, ?, ?, ?, ?, ?)`
      , [
        orderId,
        item.product_id,
        item.product_name,
        item.size || '',
        Number(item.quantity),
        Number(item.price),
      ]);
    }

    res.status(201).json({ id: orderId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

if (upload) {
  app.post('/api/uploads', authRoles(['store', 'master']), upload.array('files', 12), (req, res) => {
    const files = (req.files || []).map((file) => ({
      url: `/uploads/${file.filename}`,
      type: file.mimetype,
    }));
    res.json({ files });
  });
} else {
  app.post('/api/uploads', authRoles(['store', 'master']), (req, res) => {
    res.status(501).json({ error: 'Uploads disabled. Install multer first.' });
  });
}

app.get('/staff-login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'store.html'));
});

app.get('/staff-login/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'store-dashboard.html'));
});

app.get('/master-login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'master-login.html'));
});

app.get('/master-login/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin-dashboard.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'checkout.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'track.html'));
});

app.get('/returns', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'returns.html'));
});

app.get('/health-check', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'health.html'));
});

app.get('/api/health', authRole('master'), async (req, res) => {
  const now = new Date();
  let dbStatus = 'ok';
  try {
    await get('SELECT 1 as ok');
  } catch (error) {
    dbStatus = 'error';
    logError(`db: ${error.message}`);
  }
  let failedOrders = [];
  let logs = [];
  try {
    failedOrders = await all(
      `SELECT id, customer_name, total, status, payment_status, created_at
       FROM orders
       WHERE payment_status != 'paid' OR status = 'failed'
       ORDER BY created_at DESC
       LIMIT 10`
    );
  } catch (error) {
    logError(`failedOrders: ${error.message}`);
  }
  try {
    logs = await all(
      `SELECT level, message, created_at
       FROM system_logs
       ORDER BY id DESC
       LIMIT 50`
    );
    logs = logs.reverse();
  } catch (error) {
    logError(`systemLogs: ${error.message}`);
  }
  res.json({
    status: 'ok',
    time: now.toISOString(),
    uptime_seconds: Math.floor((Date.now() - serverStartedAt) / 1000),
    database: dbStatus,
    node: process.version,
    last_payu_callback: lastPayuCallback,
    failed_orders: failedOrders,
    errors: logs.length ? logs.map((entry) => ({
      time: entry.created_at,
      level: entry.level,
      message: entry.message,
    })) : errorLogs.slice(-50),
  });
});

app.post('/payu/success', async (req, res) => {
  try {
    lastPayuCallback = new Date().toISOString();
    const payload = req.body || {};
    const udf1Raw = payload.udf1 || '';
    let orderData = null;
    if (udf1Raw) {
      try {
        const normalized = decodeURIComponent(udf1Raw.replace(/ /g, '+'));
        const decoded = Buffer.from(normalized, 'base64').toString('utf-8');
        orderData = JSON.parse(decoded);
      } catch {
        orderData = null;
      }
    }

    const customer_name = orderData?.customer_name || payload.firstname || 'Customer';
    const customer_email = orderData?.customer_email || payload.email || '';
    const customer_phone = orderData?.customer_phone || payload.phone || '';
    const shipping_address =
      orderData?.shipping_address ||
      payload.udf2 ||
      [payload.address1, payload.address2, payload.city, payload.state, payload.zipcode || payload.zip]
        .filter(Boolean)
        .join(', ') ||
      'Not provided';

    const status = 'paid';
    const payment_status = 'paid';
    const payment_gateway = 'payu';
    const payu_txn_id = payload.txnid || '';
    const existingOrderId = payload.udf3 || '';

    const orderResponse = await (async () => {
      if (existingOrderId) {
        await run(
          `UPDATE orders
           SET customer_name = ?, customer_email = ?, customer_phone = ?, shipping_address = ?,
               payment_status = ?, status = ?, payment_gateway = ?, payu_txn_id = ?
           WHERE id = ?`,
          [
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            payment_status,
            status === 'paid' ? 'packed' : status,
            payment_gateway,
            payu_txn_id,
            existingOrderId,
          ]
        );
        return { id: existingOrderId };
      }

      const items = orderData?.items || [];
      if (items.length === 0) {
        return { id: '' };
      }
      const total = items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      );
      const orderId = `ORD-${Date.now()}`;
      const createdAt = new Date().toISOString();
      await run(
        `INSERT INTO orders (id, customer_name, customer_email, customer_phone, total, status, payment_status, payment_gateway, payu_txn_id, shipping_id, shipping_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      , [
        orderId,
        customer_name,
        customer_email,
        customer_phone,
        total,
        status === 'paid' ? 'packed' : status,
        payment_status,
        payment_gateway,
        payu_txn_id,
        '',
        shipping_address,
        createdAt,
      ]);

      for (const item of items) {
        await run(
          `INSERT INTO order_items (order_id, product_id, product_name, size, quantity, price)
           VALUES (?, ?, ?, ?, ?, ?)`
        , [
          orderId,
          item.product_id,
          item.product_name,
          item.size || '',
          Number(item.quantity),
          Number(item.price),
        ]);
      }

      return { id: orderId };
    })();

    if (!orderResponse.id) {
      return res.status(400).send('Missing order items.');
    }

    res.send(`<!doctype html>
<html><head><meta charset="utf-8"/><title>Payment Success</title></head>
<body style="font-family:Arial,sans-serif;padding:24px;">
<h2>Payment successful</h2>
<p>Your Order ID: <strong>${orderResponse.id}</strong></p>
<a href="/track">Track your order</a>
</body></html>`);
  } catch (error) {
    logError(`payu_success: ${error.message}`);
    res.status(500).send('Payment success handling failed.');
  }
});

app.post('/payu/failure', async (req, res) => {
  lastPayuCallback = new Date().toISOString();
  logError('payu_failure: payment failed callback received');
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"/><title>Payment Failed</title></head>
<body style="font-family:Arial,sans-serif;padding:24px;">
<h2>Payment failed</h2>
<p>Please try again.</p>
<a href="/checkout">Back to checkout</a>
</body></html>`);
});

app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'product.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Kouprey server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
  });
