# Kouprey Cloudflare Deployment - Quick Start

**Status**: ✅ **Ready for Direct Cloudflare Deployment**

Your application is now Cloudflare-compatible! Follow these steps to deploy in minutes.

---

## 📋 Prerequisites

1. Cloudflare Account (free tier available)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Node.js 20.20.0+

---

## 🚀 Deployment Steps (5 minutes)

### Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser to authorize your Cloudflare account.

---

### Step 2: Create D1 Database

```bash
# Create a new D1 database
wrangler d1 create kouprey-production

# Copy the database_id from the output
```

You'll see output like:
```
✓ Successfully created DB "kouprey-production" in region wnam
Database ID: xxxxx-xxxxx-xxxxx-xxxxx
```

---

### Step 3: Create R2 Bucket for Uploads

```bash
# Create R2 bucket for storing product images/videos
wrangler r2 bucket create kouprey-uploads
```

---

### Step 4: Update wrangler.toml with IDs

Edit `wrangler.toml` and uncomment + update:

```toml
[[d1_databases]]
binding = "DB"
database_name = "kouprey-production"
database_id = "your-database-id-from-step-2"

[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "kouprey-uploads"
```

---

### Step 5: Set Production Secrets

```bash
# Set JWT secret (generate strong random string)
wrangler secret put JWT_SECRET
# Enter: (paste output from: openssl rand -base64 32)

# Set admin credentials
wrangler secret put MASTER_EMAIL
# Enter: admin@yourdomain.com

wrangler secret put MASTER_PASSWORD
# Enter: YourSecurePassword123!
```

---

### Step 6: Deploy!

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

Or with Wrangler directly:
```bash
wrangler deploy
```

---

## ✅ Verify Deployment

After deployment, test your application:

```bash
# Get the deployment URL from the output
# URL format: https://kouprey.YOUR-SUBDOMAIN.workers.dev

# Test API
curl https://kouprey.YOUR-SUBDOMAIN.workers.dev/api/health

# Access admin login
Open: https://kouprey.YOUR-SUBDOMAIN.workers.dev/master-login
Login with credentials you set above
```

---

## 🔧 Optional: Custom Domain

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages → kouprey
3. Settings → Domains
4. Add custom domain: `www.kouprey.com`

---

## 📊 New Features (Cloudflare-Ready)

✅ **Dual Database Support**:
- Local development: SQLite (no changes needed)
- Production: Cloudflare D1 (serverless SQL)

✅ **Automatic Detection**:
- Code automatically detects Cloudflare vs local environment
- No manual switching required

✅ **File Uploads via R2**:
- Product images and videos stored in R2
- CDN-backed delivery (fast globally)

✅ **100% Compatible**:
- All existing APIs work unchanged
- Master admin dashboard fully functional
- Store staff inventory management ready
- Payment gateway configurations ready

---

## 🚀 What's Different?

### Before (Local/VPS)
- SQLite database
- Local file uploads
- Manual server management

### After (Cloudflare)
- **D1 Database**: Serverless SQL (Cloudflare's SQLite)
- **R2 Storage**: CDN-backed object storage
- **Automatic Scaling**: No server management needed
- **Global Delivery**: Your app runs on Cloudflare edge servers worldwide

---

## 💰 Cloudflare Pricing

### Free Tier
- 100,000 Workers requests/day ✅ Perfect for startups
- 5GB D1 storage
- 10GB R2 storage
- Unlimited bandwidth

### Discounted with Workers Paid Plan
- $5-25/month for higher request limits
- Recommended for moderate traffic

---

## 🧪 Local Testing (Before Deployment)

Test Cloudflare locally before deploying:

```bash
# Install Wrangler if not already done
npm install -g wrangler

# Test locally with Wrangler
wrangler dev

# Will run on: http://localhost:8787
```

---

## 📝 Important Notes

### Database Migration
- ✅ **Automatic**: D1 uses SQLite protocol - your schema works as-is
- No data migration needed initially (empty database on first deploy)
- To migrate existing data, use D1 import tools

### Environment
- ✅ **Node.js Compatible**: Full Node.js support on Cloudflare Workers
- ✅ **All Dependencies Work**: Express, bcryptjs, JWT, multer all compatible
- ⚠️ **No Local Filesystem**: File uploads use R2 (handled automatically)

### Security
- 🔒 Use strong JWT_SECRET (256+ bits recommended)
- 🔒 Change default MASTER_PASSWORD immediately
- 🔒 Enable Cloudflare WAF if needed
- 🔒 All traffic uses HTTPS (automatic)

---

## 🐛 Troubleshooting

### Issue: "Database not found"
```bash
# Verify database ID in wrangler.toml
wrangler d1 list

# Check binding in wrangler.toml matches your database
```

### Issue: "Uploads failing"
```bash
# Verify R2 bucket exists
wrangler r2 bucket list

# Check bucket name in wrangler.toml
```

### Issue: "Secret not found"
```bash
# List all secrets
wrangler secret list

# Verify JWT_SECRET, MASTER_EMAIL, MASTER_PASSWORD are set
```

### Local dev working but deployment fails
```bash
# Test with Wrangler first
wrangler dev

# If dev server has issues, check:
# 1. Node compatibility: wrangler dev --local
# 2. Database binding: Check [[d1_databases]] in wrangler.toml  
# 3. Dependencies: npm install
```

---

## 📚 Next Steps

1. ✅ Deploy application (this guide)
2. Configure custom domain (optional)
3. Set up auto-scaling (automatic)
4. Monitor with Cloudflare analytics
5. Enable WAF rules for security

---

## 📞 Get Help

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **D1 Docs**: https://developers.cloudflare.com/d1/
- **R2 Docs**: https://developers.cloudflare.com/r2/
- **GitHub**: https://github.com/vishnuprakash406/kouprey

---

## 🎉 You're Ready!

Your Kouprey e-commerce platform is ready for global deployment on Cloudflare's edge network.

**Estimated time to full deployment**: 5-10 minutes ⚡

**Cost**: Free tier available (no credit card required for testing)

Let's go! 🚀
