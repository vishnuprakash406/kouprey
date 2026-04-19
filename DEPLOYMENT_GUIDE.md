# Kouprey - Cloudflare Deployment Guide

## 📋 Prerequisites

1. **Cloudflare Account**: Sign up at https://cloudflare.com
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```
3. **Node.js**: v20.20.0 or higher
4. **Git**: For version control

---

## 🚀 Quick Start (Cloudflare Workers/Pages)

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate your Cloudflare account.

### Step 3: Create Cloudflare D1 Database

Since SQLite doesn't work in serverless environments, migrate to Cloudflare D1:

```bash
# Create D1 database
wrangler d1 create kouprey-production

# Note the database_id from the output
```

Update `wrangler.toml` with your database ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "kouprey-production"
database_id = "YOUR-DATABASE-ID-HERE"
```

### Step 4: Migrate Database Schema

Create a migration file `migrations/001_initial_schema.sql` with your complete schema:

```bash
# Create migrations directory
mkdir -p migrations

# Export current SQLite schema
sqlite3 data/kouprey.db .schema > migrations/001_initial_schema.sql

# Apply migration to D1
wrangler d1 execute kouprey-production --file=migrations/001_initial_schema.sql
```

### Step 5: Create R2 Bucket for Uploads

```bash
# Create R2 bucket for file uploads
wrangler r2 bucket create kouprey-uploads
```

Update `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "kouprey-uploads"
```

### Step 6: Set Environment Variables

Set production secrets in Cloudflare dashboard or via CLI:

```bash
# JWT Secret
wrangler secret put JWT_SECRET
# Enter a strong random string (e.g., use: openssl rand -base64 32)

# Master Admin Credentials
wrangler secret put MASTER_EMAIL
# Enter: your-admin@yourdomain.com

wrangler secret put MASTER_PASSWORD
# Enter: YourSecurePassword123!
```

### Step 7: Update Database Connection

Modify `server/db.js` to use D1 instead of SQLite:

```javascript
// OLD (SQLite):
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

// NEW (D1):
// D1 binding is available in env.DB
// Update all functions to use D1 API
```

Example D1 adapter:
```javascript
function run(sql, params = []) {
  return env.DB.prepare(sql).bind(...params).run();
}

function get(sql, params = []) {
  return env.DB.prepare(sql).bind(...params).first();
}

function all(sql, params = []) {
  return env.DB.prepare(sql).bind(...params).all();
}
```

### Step 8: Update Upload Handler for R2

Modify upload logic in `server/index.js`:

```javascript
// Use R2 binding instead of local filesystem
app.post('/api/staff/products/upload', authRole('store'), async (req, res) => {
  // Upload to R2 bucket
  await env.UPLOADS.put(filename, fileBuffer, {
    httpMetadata: { contentType: file.type }
  });
});
```

### Step 9: Deploy to Cloudflare

```bash
# Deploy your application
wrangler deploy

# Your app will be available at:
# https://kouprey.YOUR-SUBDOMAIN.workers.dev
```

---

## 🔧 Alternative: Cloudflare Pages (Recommended for Static + API)

### Option A: Pages + Functions

1. **Create Pages Project**:
   ```bash
   wrangler pages project create kouprey
   ```

2. **Deploy Static Assets**:
   ```bash
   wrangler pages deploy public --project-name=kouprey
   ```

3. **Add Functions** (API routes):
   - Create `functions/` directory
   - Move API endpoints to functions format
   - Example: `functions/api/products.js`

4. **Connect D1 Database**:
   - Go to Cloudflare Dashboard → Pages → kouprey → Settings → Functions
   - Add D1 database binding

---

## 🌐 Custom Domain Setup

### Step 1: Add Custom Domain in Cloudflare

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages → kouprey → Settings → Domains
3. Click "Add custom domain"
4. Enter your domain: `www.kouprey.com`

### Step 2: Update DNS Records

Cloudflare will automatically create the necessary DNS records if your domain is managed by Cloudflare.

---

## 📊 Environment Configuration

### Development (.env)
```bash
PORT=3000
JWT_SECRET=dev_secret_change_in_production
MASTER_EMAIL=master@kouprey.com
MASTER_PASSWORD=ChangeMe123!
NODE_ENV=development
```

### Production (Cloudflare Secrets)
```bash
# Set via Cloudflare Dashboard or wrangler CLI
wrangler secret put JWT_SECRET
wrangler secret put MASTER_EMAIL
wrangler secret put MASTER_PASSWORD
```

---

## 🗄️ Database Migration Script

Create `scripts/migrate-to-d1.js`:

```javascript
const sqlite3 = require('sqlite3');
const fs = require('fs');

// Export SQLite data
const db = new sqlite3.Database('./data/kouprey.db');

db.all('SELECT * FROM products', (err, products) => {
  fs.writeFileSync('products-export.json', JSON.stringify(products, null, 2));
  console.log(`Exported ${products.length} products`);
});

// Repeat for other tables...
```

Then import to D1:
```bash
# Convert JSON to SQL INSERT statements
node scripts/json-to-sql.js

# Execute on D1
wrangler d1 execute kouprey-production --file=data-import.sql
```

---

## 🧪 Testing Deployment

### Local Testing with Wrangler
```bash
# Test locally with Wrangler dev server
wrangler dev

# With D1 local database
wrangler dev --local --persist
```

### Production Testing
```bash
# After deployment, test all endpoints:
curl https://kouprey.YOUR-SUBDOMAIN.workers.dev/api/products
```

---

## 📈 Monitoring & Analytics

### Enable Cloudflare Analytics

1. Dashboard → Workers & Pages → kouprey → Analytics
2. View:
   - Request count
   - Error rates
   - Response times
   - Bandwidth usage

### Logs

```bash
# Tail live logs
wrangler tail kouprey

# Filter by status
wrangler tail kouprey --status error
```

---

## 🔒 Security Checklist

- [ ] Change default master password
- [ ] Set strong JWT_SECRET (32+ random characters)
- [ ] Enable HTTPS only (automatic on Cloudflare)
- [ ] Set CORS policies if needed
- [ ] Review and limit API rate limits
- [ ] Enable Cloudflare WAF rules
- [ ] Set up IP allow/deny lists if needed

---

## 💰 Cost Estimation

### Cloudflare Workers (Free Tier)
- **Requests**: 100,000/day free
- **D1 Database**: 5 GB storage, 5M reads/day free
- **R2 Storage**: 10 GB storage free
- **Bandwidth**: Unlimited

### Paid Tier (Workers Paid)
- **$5/month**: Increases limits significantly
- Great for production traffic

---

## 🐛 Troubleshooting

### Issue: Database Connection Errors
```bash
# Verify D1 binding
wrangler d1 info kouprey-production

# Test query
wrangler d1 execute kouprey-production --command="SELECT COUNT(*) FROM products"
```

### Issue: Upload Failures
```bash
# Check R2 bucket
wrangler r2 bucket list

# Test R2 access
wrangler r2 object put kouprey-uploads/test.txt --file=test.txt
```

### Issue: Authentication Errors
```bash
# Verify secrets are set
wrangler secret list
```

---

## 📚 Additional Resources

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **D1 Database Docs**: https://developers.cloudflare.com/d1/
- **R2 Storage Docs**: https://developers.cloudflare.com/r2/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

---

## 🔄 Rollback Procedure

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback
```

---

## 📞 Support

For deployment issues:
1. Check Cloudflare Dashboard → Workers & Pages → kouprey → Logs
2. Review `wrangler tail` output
3. Consult Cloudflare Discord: https://discord.cloudflare.com

---

**Last Updated**: February 19, 2026  
**Deployment Status**: Requires D1 and R2 migration for production
