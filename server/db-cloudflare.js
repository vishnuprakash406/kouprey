const path = require('path');
const fs = require('fs');

// Auto-detect environment (Cloudflare vs Local)
const isCloudflare = typeof globalThis !== 'undefined' && globalThis.__CLOUDFLARE__;

let db = null;
let dbModule = null;

// Initialize database based on environment
async function initDb(env) {
  if (env?.DB) {
    // Cloudflare D1 mode
    db = env.DB;
    dbModule = 'cloudflare-d1';
  } else {
    // Local SQLite mode
    try {
      const sqlite3 = require('sqlite3').verbose();
      const dbPath = path.join(__dirname, '..', 'data', 'kouprey.db');
      
      // Ensure data directory exists
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      db = new sqlite3.Database(dbPath);
      dbModule = 'sqlite3';
    } catch (error) {
      console.error('Failed to initialize database:', error.message);
      throw error;
    }
  }
}

// Promise-based database operations
async function run(sql, params = [], env = null) {
  if (!db && env?.DB) {
    db = env.DB;
    dbModule = 'cloudflare-d1';
  }

  if (dbModule === 'cloudflare-d1') {
    try {
      const result = await db.prepare(sql).bind(...params).run();
      return result;
    } catch (error) {
      throw new Error(`D1 run error: ${error.message}`);
    }
  } else {
    // SQLite mode
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
}

async function get(sql, params = [], env = null) {
  if (!db && env?.DB) {
    db = env.DB;
    dbModule = 'cloudflare-d1';
  }

  if (dbModule === 'cloudflare-d1') {
    try {
      const result = await db.prepare(sql).bind(...params).first();
      return result;
    } catch (error) {
      throw new Error(`D1 get error: ${error.message}`);
    }
  } else {
    // SQLite mode
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

async function all(sql, params = [], env = null) {
  if (!db && env?.DB) {
    db = env.DB;
    dbModule = 'cloudflare-d1';
  }

  if (dbModule === 'cloudflare-d1') {
    try {
      const result = await db.prepare(sql).bind(...params).all();
      return result.results || [];
    } catch (error) {
      throw new Error(`D1 all error: ${error.message}`);
    }
  } else {
    // SQLite mode
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

// Initialize database schema
async function init(env = null) {
  // Initialize database connection if not already done
  if (!db) {
    await initDb(env);
  }

  const tables = [
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
      review_count INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      customer_address TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_gateway TEXT,
      payment_status TEXT,
      payu_txn_id TEXT,
      shipping_id TEXT,
      notes TEXT,
      created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      size TEXT,
      created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS store_users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS master_users (
      email TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_email TEXT,
      action TEXT,
      details TEXT,
      created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      level TEXT,
      message TEXT,
      created_at TEXT
    )`,
  ];

  for (const sql of tables) {
    try {
      await run(sql, [], env);
    } catch (error) {
      // Table might already exist, ignore error
      if (!error.message.includes('already exists')) {
        console.warn('Table creation warning:', error.message);
      }
    }
  }

  console.log(`Database initialized (${dbModule})`);
}

module.exports = {
  init,
  run,
  get,
  all,
  initDb,
};
