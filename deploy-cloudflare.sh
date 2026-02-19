#!/bin/bash

# Kouprey Cloudflare Automated Deployment Script
# This script handles all deployment steps

set -e

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║   🚀 KOUPREY CLOUDFLARE DEPLOYMENT WIZARD 🚀      ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check authentication
echo -e "${BLUE}STEP 1: Cloudflare Authentication${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Checking Cloudflare authentication..."
echo ""

if wrangler whoami > /dev/null 2>&1; then
    ACCOUNT=$(wrangler whoami)
    echo -e "${GREEN}✓ Already authenticated as: $ACCOUNT${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠ Not authenticated with Cloudflare${NC}"
    echo ""
    echo "Opening Cloudflare login in your browser..."
    echo "Please authorize the Wrangler CLI."
    echo ""
    wrangler login
    echo ""
    echo -e "${GREEN}✓ Authentication successful!${NC}"
    echo ""
fi

# Step 2: Create D1 Database
echo ""
echo -e "${BLUE}STEP 2: Creating D1 Database${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Creating D1 database: kouprey-production"
echo ""

D1_OUTPUT=$(wrangler d1 create kouprey-production 2>&1 || true)

if echo "$D1_OUTPUT" | grep -q "Successfully created"; then
    D1_ID=$(echo "$D1_OUTPUT" | grep -oP '(?<=Database ID: ")[^"]*' || echo "$D1_OUTPUT" | grep -oP '(?<=ID: )[^ ]*' | head -1)
    
    if [ -z "$D1_ID" ]; then
        # Try alternative extraction
        D1_ID=$(echo "$D1_OUTPUT" | tail -5 | grep -oE '"[a-f0-9-]+"' | tail -1 | tr -d '"')
    fi
    
    if [ -n "$D1_ID" ]; then
        echo -e "${GREEN}✓ D1 Database created!${NC}"
        echo "   Database ID: $D1_ID"
        
        # Save to file for later use
        echo "$D1_ID" > /tmp/d1_id.txt
    else
        echo -e "${YELLOW}⚠ Database created but ID not captured${NC}"
        echo "   Run: wrangler d1 list"
        echo "   And update wrangler.toml manually with the database_id"
    fi
elif echo "$D1_OUTPUT" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠ Database 'kouprey-production' already exists${NC}"
    echo "   Using existing database..."
    echo "   Run 'wrangler d1 list' to get the database_id"
else
    echo -e "${RED}✗ Failed to create database${NC}"
    echo "Error output:"
    echo "$D1_OUTPUT"
    exit 1
fi

echo ""

# Step 3: Create R2 Bucket
echo -e "${BLUE}STEP 3: Creating R2 Storage Bucket${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Creating R2 bucket: kouprey-uploads"
echo ""

R2_OUTPUT=$(wrangler r2 bucket create kouprey-uploads 2>&1 || true)

if echo "$R2_OUTPUT" | grep -q -E "success|created"; then
    echo -e "${GREEN}✓ R2 Bucket created!${NC}"
    echo "   Bucket: kouprey-uploads"
elif echo "$R2_OUTPUT" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠ Bucket 'kouprey-uploads' already exists${NC}"
    echo "   Using existing bucket..."
else
    echo "R2 Output: $R2_OUTPUT"
    echo "Continuing anyway..."
fi

echo ""

# Step 4: List databases to confirm
echo -e "${BLUE}STEP 4: Verifying D1 Database${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Available D1 databases:"
echo ""

D1_LIST=$(wrangler d1 list 2>&1)
echo "$D1_LIST"
echo ""

# Extract database ID
D1_ID_FROM_LIST=$(echo "$D1_LIST" | grep "kouprey-production" | grep -oE "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}" | head -1)

if [ -z "$D1_ID_FROM_LIST" ] && [ -f /tmp/d1_id.txt ]; then
    D1_ID_FROM_LIST=$(cat /tmp/d1_id.txt)
fi

if [ -n "$D1_ID_FROM_LIST" ]; then
    echo -e "${GREEN}Found database ID: $D1_ID_FROM_LIST${NC}"
    echo ""
fi

echo ""

# Step 5: Set Secrets
echo -e "${BLUE}STEP 5: Setting Production Secrets${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate JWT Secret
echo -e "${YELLOW}Generating JWT_SECRET...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET
echo -e "${GREEN}✓ JWT_SECRET set${NC}"
echo ""

# Set Master Email
echo -e "${YELLOW}Setting MASTER_EMAIL...${NC}"
read -p "Enter master admin email (default: master@kouprey.com): " MASTER_EMAIL
MASTER_EMAIL=${MASTER_EMAIL:-master@kouprey.com}
echo "$MASTER_EMAIL" | wrangler secret put MASTER_EMAIL
echo -e "${GREEN}✓ MASTER_EMAIL set to: $MASTER_EMAIL${NC}"
echo ""

# Set Master Password
echo -e "${YELLOW}Setting MASTER_PASSWORD...${NC}"
read -s -p "Enter master admin password (min 12 characters): " MASTER_PASSWORD
echo ""

if [ ${#MASTER_PASSWORD} -lt 12 ]; then
    echo -e "${RED}✗ Password too short (minimum 12 characters)${NC}"
    exit 1
fi

echo "$MASTER_PASSWORD" | wrangler secret put MASTER_PASSWORD
echo -e "${GREEN}✓ MASTER_PASSWORD set${NC}"
echo ""

# Step 6: Update wrangler.toml if we have the database ID
if [ -n "$D1_ID_FROM_LIST" ]; then
    echo -e "${BLUE}STEP 6: Updating wrangler.toml${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Updating wrangler.toml with database ID..."
    echo ""
    
    # Backup original
    cp wrangler.toml wrangler.toml.backup
    
    # Update database ID in wrangler.toml
    sed -i '' "s/database_id = \"your-database-id\"/database_id = \"$D1_ID_FROM_LIST\"/" wrangler.toml
    sed -i '' "s/database_id = \"\"/database_id = \"$D1_ID_FROM_LIST\"/" wrangler.toml
    
    echo -e "${GREEN}✓ wrangler.toml updated${NC}"
    echo "   Database ID: $D1_ID_FROM_LIST"
    echo ""
    echo "Make sure these sections exist in wrangler.toml:"
    echo "   [[d1_databases]]"
    echo "   binding = \"DB\""
    echo "   database_name = \"kouprey-production\""
    echo "   database_id = \"$D1_ID_FROM_LIST\""
    echo ""
    echo "   [[r2_buckets]]"
    echo "   binding = \"UPLOADS\""
    echo "   bucket_name = \"kouprey-uploads\""
    echo ""
else
    echo -e "${YELLOW}⚠ Could not find database ID in wrangler.toml${NC}"
    echo "Please manually update wrangler.toml with:"
    echo ""
    echo "[[d1_databases]]"
    echo "binding = \"DB\""
    echo "database_name = \"kouprey-production\""
    echo "database_id = \"YOUR-DATABASE-ID-HERE\""
    echo ""
    echo "Run 'wrangler d1 list' to get your database_id"
    echo ""
    read -p "Press Enter after updating wrangler.toml... "
fi

echo ""

# Step 7: Deploy!
echo -e "${BLUE}STEP 7: Deploying to Cloudflare${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Deploying Kouprey application..."
echo ""

npm run deploy

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║        ✅ DEPLOYMENT SUCCESSFUL! ✅              ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}Your application is now live on Cloudflare!${NC}"
echo ""
echo "📊 Deployment Details:"
echo "   Admin Email: $MASTER_EMAIL"
echo "   Database: kouprey-production ($D1_ID_FROM_LIST)"
echo "   Storage: kouprey-uploads"
echo ""
echo "🌐 Access your app:"
echo "   https://kouprey.YOUR-SUBDOMAIN.workers.dev"
echo ""
echo "🔗 View logs:"
echo "   npm run cf:tail"
echo ""
echo "📱 Admin Login:"
echo "   Email: $MASTER_EMAIL"
echo "   URL: https://kouprey.YOUR-SUBDOMAIN.workers.dev/master-login"
echo ""
echo "🎉 Enjoy your live Kouprey e-commerce platform!"
echo ""
