#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# GITHUB SECRETS AUTO-SETUP HELPER
# ═══════════════════════════════════════════════════════════════

# This script helps you set up GitHub Secrets for CI/CD deployment
# Requires: GitHub CLI (gh) installed and authenticated

set -e

REPO="soumyadeepsarkar-2004/SarkarBrothers"
REQUIRED_STAGING_SECRETS=(
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_REGION"
  "AWS_S3_CUSTOMER_STAGING"
  "AWS_S3_ADMIN_STAGING"
  "AWS_LAMBDA_FUNCTION_STAGING"
  "AWS_CLOUDFRONT_DIST_STAGING"
)

REQUIRED_PROD_SECRETS=(
  "PROD_AWS_ACCESS_KEY_ID"
  "PROD_AWS_SECRET_ACCESS_KEY"
  "PROD_AWS_REGION"
  "PROD_AWS_S3_CUSTOMER"
  "PROD_AWS_S3_ADMIN"
  "PROD_AWS_LAMBDA_FUNCTION"
  "PROD_AWS_CLOUDFRONT_DIST"
)

OPTIONAL_SECRETS=(
  "SLACK_WEBHOOK"
)

echo "═══════════════════════════════════════════════════════════════"
echo "GitHub Secrets Setup for SarkarBrothers CI/CD"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) not found."
  echo "Install with: https://cli.github.com"
  exit 1
fi

# Check if authenticated
if ! gh auth status > /dev/null 2>&1; then
  echo "❌ Not authenticated with GitHub"
  echo "Run: gh auth login"
  exit 1
fi

echo "Using repository: $REPO"
echo ""

# Function to set a secret
set_secret() {
  local secret_name=$1
  local secret_value=$2
  
  if [ -z "$secret_value" ]; then
    echo "⏭️  Skipping $secret_name (empty value)"
    return
  fi
  
  echo -n "Setting $secret_name... "
  echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO" 2>/dev/null
  echo "✅"
}

# Setup Staging Secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STAGING SECRETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for secret in "${REQUIRED_STAGING_SECRETS[@]}"; do
  read -p "Enter value for $secret: " value
  set_secret "$secret" "$value"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PRODUCTION SECRETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for secret in "${REQUIRED_PROD_SECRETS[@]}"; do
  read -p "Enter value for $secret: " value
  set_secret "$secret" "$value"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OPTIONAL SECRETS (press Enter to skip)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for secret in "${OPTIONAL_SECRETS[@]}"; do
  read -p "Enter value for $secret (optional): " value
  set_secret "$secret" "$value"
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ All secrets have been set!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Verify secrets were set correctly:"
echo "  gh secret list --repo $REPO"
echo ""
echo "View workflow errors:"
echo "  https://github.com/$REPO/actions"
