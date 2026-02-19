// Cloudflare Pages Functions wrapper for the Express app
// This file is used as the entry point for Cloudflare Pages Functions

const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Import the enhanced database module that supports both SQLite and D1
const dbModule = require('./db-cloudflare');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8787;
const serverStartedAt = Date.now();
const errorLogs = [];
let lastPayuCallback = null;

const JWT_SECRET = process.env.JWT_SECRET || 'kouprey_dev_secret';
const MASTER_EMAIL = process.env.MASTER_EMAIL || 'master@kouprey.com';
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'ChangeMe123!';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// File upload handlers
let upload = null;
try {
  const multer = require('multer');
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
  
  // Ensure uploads directory exists (for local dev)
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  });
  upload = multer({ storage });
} catch (error) {
  console.warn('Multer not available. Local uploads disabled.');
}

// Database operation wrappers
async function dbRun(sql, params = [], env = null) {
  return dbModule.run(sql, params, env);
}

async function dbGet(sql, params = [], env = null) {
  return dbModule.get(sql, params, env);
}

async function dbAll(sql, params = [], env = null) {
  return dbModule.all(sql, params, env);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

async function logEvent(level, message, env = null) {
  const entry = { time: new Date().toISOString(), level, message };
  errorLogs.push(entry);
  if (errorLogs.length > 50) errorLogs.shift();
  
  try {
    await dbRun(
      `INSERT INTO system_logs (level, message, created_at)
       VALUES (?, ?, ?)`,
      [level, message, entry.time],
      env
    );
  } catch (err) {
    // Ignore logging errors
  }
}

function logError(message, env = null) {
  logEvent('error', message, env);
}

process.on('uncaughtException', (err) => {
  logEvent('error', `uncaughtException: ${err.stack || err.message || err}`);
});

process.on('unhandledRejection', (reason) => {
  logEvent('error', `unhandledRejection: ${reason?.stack || reason}`);
});

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
        return res.status(403).json({ error: `Requires ${roles.join(' or ')} role` });
      }
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// ============ API ROUTES ============

// Health check
app.get('/api/health', async (req, res) => {
  const uptime = Date.now() - serverStartedAt;
  res.json({
    status: 'ok',
    uptime,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// This is a sample - the full server/index.js has more endpoints
// Reference the original server/index.js for complete API routes

// Master admin login
app.post('/api/master/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === MASTER_EMAIL && password === MASTER_PASSWORD) {
    const token = signToken({ role: 'master', email });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Staff login
app.post('/api/staff/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await dbGet('SELECT * FROM store_users WHERE email = ?', [email]);
    
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    const match = await new Promise((resolve) => {
      bcrypt.compare(password, user.password, (err, result) => {
        resolve(!err && result);
      });
    });

    if (!match) return res.status(401).json({ error: 'Invalid password' });

    const token = signToken({ role: 'store', email });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SPA routes
app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'product.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Export for both local and Cloudflare
module.exports = app;

// For Cloudflare Functions
export default app;

// For local development
if (typeof globalThis !== 'undefined' && !globalThis.__CLOUDFLARE__) {
  const PORT_LOCAL = process.env.PORT || 3000;
  
  // Initialize database and start server
  dbModule.init().then(() => {
    app.listen(PORT_LOCAL, () => {
      console.log(`Kouprey server running on http://localhost:${PORT_LOCAL}`);
    });
  }).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
