#!/bin/bash

# Cloudflare Deployment Setup Script
# Automates D1 database and R2 bucket creation

set -e

echo "🚀 Kouprey Cloudflare Setup"
echo "============================"
echo ""

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please authenticate with Cloudflare:"
    wrangler login
fi

echo ""
echo "📦 Creating D1 Database..."
echo "This will create 'kouprey-production' database"
echo ""

# Create D1 database
D1_OUTPUT=$(wrangler d1 create kouprey-production 2>&1 || true)

if echo "$D1_OUTPUT" | grep -q "database_id"; then
    # Extract database ID from output
    D1_ID=$(echo "$D1_OUTPUT" | grep "database_id" | head -1 | sed 's/.*"\(.*\)".*/\1/' || echo "")
    if [ -z "$D1_ID" ]; then
        D1_ID=$(echo "$D1_OUTPUT" | grep "Database ID:" | awk '{print $NF}')
    fi
    
    if [ -n "$D1_ID" ]; then
        echo "✅ D1 Database created!"
        echo "   Database ID: $D1_ID"
        echo ""
        echo "⚠️  Add this to wrangler.toml:"
        echo "   [[d1_databases]]"
        echo "   binding = \"DB\""
        echo "   database_name = \"kouprey-production\""
        echo "   database_id = \"$D1_ID\""
        echo ""
    else
        echo "✅ D1 Database created! (ID not extracted)"
        echo "   Run: wrangler d1 list"
        echo "   Copy the database_id to wrangler.toml"
    fi
else
    echo "✅ D1 Database command executed"
    echo "   Run: wrangler d1 list"
    echo "   Copy the database_id to wrangler.toml"
fi

echo ""
echo "📁 Creating R2 Bucket..."
echo ""

# Create R2 bucket
R2_OUTPUT=$(wrangler r2 bucket create kouprey-uploads 2>&1 || true)

if echo "$R2_OUTPUT" | grep -q "Create succeeded" || echo "$R2_OUTPUT" | grep -q "created"; then
    echo "✅ R2 Bucket created!"
    echo "   Bucket: kouprey-uploads"
    echo ""
    echo "⚠️  Add this to wrangler.toml:"
    echo "   [[r2_buckets]]"
    echo "   binding = \"UPLOADS\""
    echo "   bucket_name = \"kouprey-uploads\""
    echo ""
else
    echo "✅ R2 Bucket command executed"
    echo "   Run: wrangler r2 bucket list"
    echo "   Verify 'kouprey-uploads' exists"
fi

echo ""
echo "🔐 Setting Secrets..."
echo ""

# Set JWT Secret
echo "Enter JWT_SECRET (or press Enter to skip):"
echo "Tip: Generate with: openssl rand -base64 32"
read -p "> " JWT_SECRET

if [ -n "$JWT_SECRET" ]; then
    echo "$JWT_SECRET" | wrangler secret put JWT_SECRET
    echo "✅ JWT_SECRET set"
fi

# Set Master Email
echo ""
echo "Enter MASTER_EMAIL (or press Enter to skip):"
echo "Default: master@kouprey.com"
read -p "> " MASTER_EMAIL

if [ -n "$MASTER_EMAIL" ]; then
    echo "$MASTER_EMAIL" | wrangler secret put MASTER_EMAIL
    echo "✅ MASTER_EMAIL set"
fi

# Set Master Password
echo ""
echo "Enter MASTER_PASSWORD (or press Enter to skip):"
echo "⚠️  Use a strong password (min 12 characters)"
read -s -p "> " MASTER_PASSWORD
echo ""

if [ -n "$MASTER_PASSWORD" ]; then
    echo "$MASTER_PASSWORD" | wrangler secret put MASTER_PASSWORD
    echo "✅ MASTER_PASSWORD set"
fi

echo ""
echo "=============================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update wrangler.toml with D1 and R2 IDs (see above)"
echo "2. Test locally: npm run cf:dev"
echo "3. Deploy: npm run deploy"
echo ""
echo "Get your deployment URL:"
echo "  npm run deploy | grep 'Deployed to'"
echo ""
echo "View live logs:"
echo "  npm run cf:tail"
echo ""
