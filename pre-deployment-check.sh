#!/bin/bash

# Kouprey Pre-Deployment Checklist Script

echo "🚀 Kouprey Pre-Deployment Checklist"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="20.20.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo -e "${GREEN}✓ Node.js version: v$NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js version v$NODE_VERSION is below required v$REQUIRED_VERSION${NC}"
fi
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Dependencies not installed. Run: npm install${NC}"
fi
echo ""

# Check for required files
echo "📄 Checking required files..."
FILES=("package.json" "server/index.js" "server/db.js" "wrangler.toml" "RELEASE_NOTES.md" "DEPLOYMENT_GUIDE.md")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file missing${NC}"
    fi
done
echo ""

# Check if .env exists
echo "🔐 Checking environment configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    echo -e "${YELLOW}⚠ Remember to set production secrets in Cloudflare!${NC}"
else
    echo -e "${YELLOW}⚠ .env file not found (optional for local dev)${NC}"
fi
echo ""

# Check if wrangler is installed
echo "☁️  Checking Cloudflare Wrangler..."
if command -v wrangler &> /dev/null; then
    WRANGLER_VERSION=$(wrangler --version)
    echo -e "${GREEN}✓ Wrangler installed: $WRANGLER_VERSION${NC}"
else
    echo -e "${RED}✗ Wrangler not installed. Run: npm install -g wrangler${NC}"
fi
echo ""

# Security checklist
echo "🔒 Security Checklist:"
echo "   □ Changed default master password from 'ChangeMe123!'"
echo "   □ Set strong JWT_SECRET (32+ random characters)"
echo "   □ Configured production environment variables"
echo "   □ Reviewed API rate limits"
echo "   □ Enabled HTTPS (automatic on Cloudflare)"
echo ""

# Database migration checklist
echo "🗄️  Database Migration Checklist (for Cloudflare):"
echo "   □ Created Cloudflare D1 database"
echo "   □ Exported SQLite schema: npm run db:export"
echo "   □ Migrated schema to D1"
echo "   □ Imported data to D1"
echo "   □ Updated server/db.js for D1 binding"
echo ""

# File storage checklist
echo "📁 File Storage Checklist (for Cloudflare):"
echo "   □ Created Cloudflare R2 bucket"
echo "   □ Updated upload logic for R2"
echo "   □ Migrated existing uploads to R2"
echo "   □ Updated wrangler.toml with R2 binding"
echo ""

# Deployment checklist
echo "🚀 Deployment Checklist:"
echo "   □ Tested locally: npm run dev"
echo "   □ Authenticated with Cloudflare: wrangler login"
echo "   □ Set Cloudflare secrets: wrangler secret put JWT_SECRET"
echo "   □ Updated wrangler.toml with database/bucket IDs"
echo "   □ Ready to deploy: npm run deploy"
echo ""

echo "===================================="
echo "✨ Review the checklist above before deploying!"
echo ""
echo "Next steps:"
echo "1. Review DEPLOYMENT_GUIDE.md for detailed instructions"
echo "2. Complete database and storage migration"
echo "3. Set production secrets in Cloudflare"
echo "4. Run: npm run deploy"
echo ""
