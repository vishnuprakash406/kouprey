# 🚀 DEPLOY KOUPREY TO CLOUDFLARE - STEP BY STEP

Your Kouprey e-commerce application is ready to deploy! Follow these exact steps:

---

## 📋 STEP 1: Authenticate with Cloudflare

Open your terminal and run:

```bash
wrangler login
```

This will:
- Open a browser window
- Ask you to log in to Cloudflare
- Grant permission to Wrangler
- Return to terminal when complete

**If you don't have a Cloudflare account:**
1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account
3. Come back and run `wrangler login`

---

## 🗄️ STEP 2: Create D1 Database

Run:

```bash
wrangler d1 create kouprey-production
```

You'll see output like:
```
✓ Successfully created DB "kouprey-production"
Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Copy the Database ID** - you'll need it in the next step.

---

## 📁 STEP 3: Create R2 Storage Bucket

Run:

```bash
wrangler r2 bucket create kouprey-uploads
```

You should see:
```
✓ Created bucket "kouprey-uploads"
```

---

## ⚙️ STEP 4: Update wrangler.toml

Edit `wrangler.toml` and find this line:

```toml
database_id = "your-database-id"
```

Replace it with the ID from Step 2. For example:

```toml
database_id = "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
```

---

## 🔐 STEP 5: Set Production Secrets

Run each of these commands:

### 5a. Set JWT Secret

```bash
wrangler secret put JWT_SECRET
```

Generate a strong random string. Run this to get one:

```bash
openssl rand -base64 32
```

Copy the output and paste it when prompted.

### 5b. Set Admin Email

```bash
wrangler secret put MASTER_EMAIL
```

Enter your admin email (or press Enter to use: `master@kouprey.com`)

### 5c. Set Admin Password

```bash
wrangler secret put MASTER_PASSWORD
```

Enter a strong password (minimum 12 characters). Example: `MySecure@Password123`

---

## 🚀 STEP 6: Deploy!

Run:

```bash
npm run deploy
```

This will upload your application to Cloudflare. Wait for it to complete.

You'll see output like:

```
✓ Uploaded kouprey (45 files)
✓ Deployed to https://kouprey.YOUR-SUBDOMAIN.workers.dev
```

---

## ✅ STEP 7: Verify Your Deployment

Test your live app:

```bash
# Visit in browser
https://kouprey.YOUR-SUBDOMAIN.workers.dev/master-login
```

Login with:
- Email: The one you set in Step 5b
- Password: The one you set in Step 5c

---

## 📞 QUICK REFERENCE COMMANDS

```bash
# Authentication
wrangler login

# Database management
wrangler d1 list                           # List all databases
wrangler d1 create kouprey-production      # Create new database

# Storage management  
wrangler r2 bucket list                    # List all buckets
wrangler r2 bucket create kouprey-uploads  # Create new bucket

# Secrets
wrangler secret list                       # List all secrets
wrangler secret put JWT_SECRET             # Set JWT secret
wrangler secret put MASTER_EMAIL           # Set admin email
wrangler secret put MASTER_PASSWORD        # Set admin password

# Deployment
npm run deploy                             # Deploy to Cloudflare
npm run cf:dev                             # Test locally
npm run cf:tail                            # View live logs
```

---

## 🎯 Troubleshooting

### "Not authenticated" error

Run: `wrangler login` and complete browser authorization

### "Database not found" error

1. Run: `wrangler d1 list`
2. Copy the ID from the output
3. Update `database_id` in `wrangler.toml`
4. Run: `npm run deploy` again

### "SECRET not found" error

The secrets take a moment to propagate. Wait 30 seconds and try again.

### "Cannot find module" error

Run: `npm install` in the project directory

---

## 🌐 Access Your Deployment

After successful deployment:

| Page | URL |
|------|-----|
| Store | `https://kouprey.YOUR-SUBDOMAIN.workers.dev/` |
| Products | `https://kouprey.YOUR-SUBDOMAIN.workers.dev/product` |
| Admin Login | `https://kouprey.YOUR-SUBDOMAIN.workers.dev/master-login` |
| Staff Login | `https://kouprey.YOUR-SUBDOMAIN.workers.dev/staff-login` |
| Track Order | `https://kouprey.YOUR-SUBDOMAIN.workers.dev/track` |
| Returns | `https://kouprey.YOUR-SUBDOMAIN.workers.dev/returns` |

---

## 📊 Monitor Your App

View real-time logs:

```bash
npm run cf:tail
```

---

## 🎉 You're Live!

Your Kouprey e-commerce platform is now running on Cloudflare's global edge network!

**Features enabled:**
✅ Global CDN  
✅ Automatic HTTPS  
✅ D1 Database  
✅ R2 Storage  
✅ 100% Uptime  

**Next steps:**
1. Configure custom domain (optional)
2. Set up email notifications
3. Review Cloudflare analytics

---

**Need help?** See the complete guides:
- CLOUDFLARE_QUICK_START.md
- RELEASE_NOTES.md
- README.md

Happy deploying! 🚀
