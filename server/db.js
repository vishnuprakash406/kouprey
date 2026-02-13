const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'data', 'kouprey.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function init() {
  await run(
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      price REAL NOT NULL,
      discount REAL DEFAULT 0,
      sizes TEXT NOT NULL,
      stock INTEGER NOT NULL,
      availability TEXT NOT NULL,
      image TEXT,
      images TEXT,
      videos TEXT,
      color TEXT,
      rating REAL,
      review_count INTEGER,
      description TEXT,
      updated_at TEXT NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS store_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS master_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      payment_gateway TEXT,
      payu_txn_id TEXT,
      shipping_id TEXT,
      shipping_address TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      size TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )`
  );

  const orderColumns = await all('PRAGMA table_info(orders)');
  const orderColumnNames = orderColumns.map((col) => col.name);
  if (!orderColumnNames.includes('customer_phone')) {
    await run('ALTER TABLE orders ADD COLUMN customer_phone TEXT');
  }
  if (!orderColumnNames.includes('shipping_id')) {
    await run('ALTER TABLE orders ADD COLUMN shipping_id TEXT');
  }
  if (!orderColumnNames.includes('payment_gateway')) {
    await run('ALTER TABLE orders ADD COLUMN payment_gateway TEXT');
  }
  if (!orderColumnNames.includes('payu_txn_id')) {
    await run('ALTER TABLE orders ADD COLUMN payu_txn_id TEXT');
  }

  await run(
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      detail TEXT,
      created_at TEXT NOT NULL
    )`
  );

  await run(
    `CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`
  );

  const columns = await all('PRAGMA table_info(products)');
  const columnNames = columns.map((col) => col.name);
  const addColumn = async (name, definition) => {
    if (!columnNames.includes(name)) {
      await run(`ALTER TABLE products ADD COLUMN ${name} ${definition}`);
    }
  };

  await addColumn('images', 'TEXT');
  await addColumn('videos', 'TEXT');
  await addColumn('color', 'TEXT');
  await addColumn('rating', 'REAL');
  await addColumn('review_count', 'INTEGER');
  await addColumn('subcategory', 'TEXT');

  const count = await get('SELECT COUNT(*) as count FROM products');
  if (count && count.count === 0) {
    const now = new Date().toISOString();
    const seed = [
      {
        id: 'kouprey-001',
        name: 'Cityline Trench',
        category: 'women',
        subcategory: 'Outerwear',
        price: 180,
        discount: 40,
        sizes: 'S,M,L',
        stock: 18,
        availability: 'in_stock',
        image:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
        ],
        videos: [],
        color: 'Sand',
        rating: 4.6,
        review_count: 124,
        description: 'Water-resistant trench with clean seams and a sculpted collar.',
      },
      {
        id: 'kouprey-002',
        name: 'Arc Knit Top',
        category: 'women',
        subcategory: 'Tops',
        price: 68,
        discount: 20,
        sizes: 'XS,S,M',
        stock: 24,
        availability: 'in_stock',
        image:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
        images: [
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
        ],
        videos: [],
        color: 'Ivory',
        rating: 4.4,
        review_count: 78,
        description: 'Soft knit with a subtle sheen and elongated sleeve.',
      },
      {
        id: 'kouprey-003',
        name: 'Cinder Cargo',
        category: 'men',
        subcategory: 'Bottoms',
        price: 94,
        discount: 40,
        sizes: 'S,M,L,XL',
        stock: 8,
        availability: 'low_stock',
        image:
          'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
        images: [
          'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
        ],
        videos: [],
        color: 'Charcoal',
        rating: 4.2,
        review_count: 56,
        description: 'Utility cargo pant with matte hardware and a tapered leg.',
      },
      {
        id: 'kouprey-004',
        name: 'Studio Bag',
        category: 'women',
        subcategory: 'Accessories',
        price: 120,
        discount: 0,
        sizes: 'One Size',
        stock: 0,
        availability: 'out_of_stock',
        image:
          'https://images.unsplash.com/photo-1527383418406-f85a3b146499?auto=format&fit=crop&w=900&q=80',
        images: [
          'https://images.unsplash.com/photo-1527383418406-f85a3b146499?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
        ],
        videos: [],
        color: 'Onyx',
        rating: 4.8,
        review_count: 210,
        description: 'Structured canvas bag with hidden magnetic closure.',
      },
      {
        id: 'kouprey-005',
        name: 'Noir Shirt Dress',
        category: 'women',
        subcategory: 'Dresses',
        price: 130,
        discount: 30,
        sizes: 'S,M,L',
        stock: 12,
        availability: 'preorder',
        image:
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
        images: [
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
        ],
        videos: [],
        color: 'Noir',
        rating: 4.5,
        review_count: 92,
        description: 'Relaxed shirt dress with oversized cuffs and hidden placket.',
      },
      {
        id: 'kouprey-006',
        name: 'Cloud Runner Hoodie',
        category: 'kids',
        subcategory: 'Sweatshirts',
        price: 55,
        discount: 0,
        sizes: 'XS,S,M',
        stock: 16,
        availability: 'in_stock',
        image:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
        images: [
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
        ],
        videos: [],
        color: 'Sky',
        rating: 4.7,
        review_count: 38,
        description: 'Soft fleece hoodie built for play and comfort.',
      },
    ];

    for (const item of seed) {
      await run(
        `INSERT INTO products (id, name, category, subcategory, price, discount, sizes, stock, availability, image, description, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      , [
        item.id,
        item.name,
        item.category,
        item.subcategory || '',
        item.price,
        item.discount,
        item.sizes,
        item.stock,
        item.availability,
        item.image,
        item.description,
        now,
      ]);
    }

    for (const item of seed) {
      await run(
        `UPDATE products
         SET images = ?, videos = ?, color = ?, rating = ?, review_count = ?, subcategory = ?
         WHERE id = ?`
      , [
        JSON.stringify(item.images || []),
        JSON.stringify(item.videos || []),
        item.color || '',
        item.rating || 0,
        item.review_count || 0,
        item.subcategory || '',
        item.id,
      ]);
    }
  }

  const orderCount = await get('SELECT COUNT(*) as count FROM orders');
  if (orderCount && orderCount.count === 0) {
    const now = new Date().toISOString();
    const orders = [
      {
        id: 'ORD-1001',
        customer_name: 'Anya Rao',
        customer_email: 'anya@example.com',
        total: 298,
        status: 'processing',
        payment_status: 'paid',
        shipping_address: '14 Orchid Lane, Bengaluru, KA 560001',
        created_at: now,
        items: [
          { product_id: 'kouprey-001', product_name: 'Cityline Trench', size: 'M', quantity: 1, price: 140 },
          { product_id: 'kouprey-003', product_name: 'Cinder Cargo', size: 'L', quantity: 1, price: 158 },
        ],
      },
      {
        id: 'ORD-1002',
        customer_name: 'Rahul Mehta',
        customer_email: 'rahul@example.com',
        total: 98,
        status: 'shipped',
        payment_status: 'paid',
        shipping_address: '22 Palm Grove, Mumbai, MH 400001',
        created_at: now,
        items: [
          { product_id: 'kouprey-005', product_name: 'Noir Shirt Dress', size: 'S', quantity: 1, price: 98 },
        ],
      },
      {
        id: 'ORD-1003',
        customer_name: 'Ishita Kapoor',
        customer_email: 'ishita@example.com',
        total: 55,
        status: 'pending',
        payment_status: 'pending',
        shipping_address: '77 Riverwalk, Delhi 110001',
        created_at: now,
        items: [
          { product_id: 'kouprey-006', product_name: 'Cloud Runner Hoodie', size: 'S', quantity: 1, price: 55 },
        ],
      },
    ];

    for (const order of orders) {
      await run(
        `INSERT INTO orders (id, customer_name, customer_email, total, status, payment_status, shipping_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      , [
        order.id,
        order.customer_name,
        order.customer_email,
        order.total,
        order.status,
        order.payment_status,
        order.shipping_address,
        order.created_at,
      ]);

      for (const item of order.items) {
        await run(
          `INSERT INTO order_items (order_id, product_id, product_name, size, quantity, price)
           VALUES (?, ?, ?, ?, ?, ?)`
        , [
          order.id,
          item.product_id,
          item.product_name,
          item.size,
          item.quantity,
          item.price,
        ]);
      }
    }
  }

  const masterCount = await get('SELECT COUNT(*) as count FROM master_users');
  if (masterCount && masterCount.count === 0) {
    const hash = await require('bcryptjs').hash(process.env.MASTER_PASSWORD || 'ChangeMe123!', 10);
    await run(
      `INSERT INTO master_users (email, password_hash, created_at)
       VALUES (?, ?, ?)`
    , [
      process.env.MASTER_EMAIL || 'master@kouprey.com',
      hash,
      new Date().toISOString(),
    ]);
  }
}

module.exports = { db, run, get, all, init };
