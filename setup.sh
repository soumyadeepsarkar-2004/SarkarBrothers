#!/bin/bash
# 🚀 SarkarBrothers - Automated Setup Script
# Install all dependencies and configure dual-portal environment

set -e  # Exit on error

echo "🔧 SarkarBrothers Dual-Portal Setup"
echo "===================================="
echo ""

# Check Node.js
echo "✅ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Please install Node.js 22.x"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "   Found: $NODE_VERSION"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo "   ✅ Done"
echo ""

# Install customer portal dependencies
echo "📦 Installing customer portal dependencies..."
cd customer-portal
npm install
cd ..
echo "   ✅ Done"
echo ""

# Install admin portal dependencies
echo "📦 Installing admin portal dependencies..."
cd admin-portal
npm install
cd ..
echo "   ✅ Done"
echo ""

# Create .env file if it doesn't exist
echo "📝 Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "   ⚠️  Created .env from .env.example"
    echo "   📋 Please update .env with your credentials:"
    echo "      - MONGODB_URI"
    echo "      - JWT_SECRET (generate random 32-char string)"
    echo "      - STRIPE_SECRET_KEY"
    echo "      - GEMINI_API_KEY"
    echo ""
else
    echo "   ✅ .env already exists"
fi
echo ""

# Verify directory structure
echo "✅ Verifying directory structure..."
dirs=("customer-portal/src" "admin-portal/src" "shared/types" "shared/middleware" "server")
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir"
    else
        echo "   ❌ $dir (missing!)"
    fi
done
echo ""

# Check key files
echo "✅ Checking key files..."
files=(
    "server/index-v2.js"
    "shared/types/index.ts"
    "shared/middleware/auth.ts"
    "customer-portal/src/App.tsx"
    "admin-portal/src/App.tsx"
    ".github/workflows/deploy.yml"
    "DEPLOYMENT.md"
)
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (missing!)"
    fi
done
echo ""

echo "🚀 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your credentials"
echo "2. Run: npm run dev:portals"
echo "3. Open: http://localhost:3001 (customer) or http://localhost:3002 (admin)"
echo ""
echo "For more info, see README_DUAL_PORTAL.md"
