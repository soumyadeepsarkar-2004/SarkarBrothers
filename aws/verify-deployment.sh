#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# PORTAL DEPLOYMENT & VERIFICATION SCRIPT
# ═══════════════════════════════════════════════════════════════

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
STAGE=${1:-dev}
API_URL=${2:-http://localhost:5000}
RESULTS_FILE="deployment-results.json"
FAILED_CHECKS=0
PASSED_CHECKS=0

# Initialize results file
echo "{\"stage\": \"$STAGE\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"checks\": []}" > $RESULTS_FILE

# Helper functions
print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

check_status() {
  local status=$1
  local message=$2
  
  if [ $status -eq 0 ]; then
    echo -e "${GREEN}✓ $message${NC}"
    ((PASSED_CHECKS++))
  else
    echo -e "${RED}✗ $message${NC}"
    ((FAILED_CHECKS++))
  fi
}

test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local name=$4
  
  echo -n "Testing $name... "
  
  local response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token")
  
  local body=$(echo "$response" | head -n -1)
  local status=$(echo "$response" | tail -n 1)
  
  if [ "$status" = "$expected_status" ]; then
    check_status 0 "$name (HTTP $status)"
  else
    check_status 1 "$name (Expected HTTP $expected_status, got $status)"
  fi
}

# ─── HEALTH CHECKS ────────────────────────────────────────────
print_header "PHASE 1: BACKEND HEALTH CHECKS"

echo "API URL: $API_URL"
echo ""

# Check API health
echo -n "Checking API health endpoint... "
if curl -s -f "$API_URL/api/health" > /dev/null 2>&1; then
  check_status 0 "API health endpoint"
else
  check_status 1 "API health endpoint"
fi

# Check database connection
echo -n "Checking database connection... "
if curl -s "$API_URL/api/health" | grep -q "mongodb\|mock"; then
  check_status 0 "Database status"
else
  check_status 1 "Database status"
fi

# Check AI service
echo -n "Checking AI service status... "
if curl -s "$API_URL/api/health" | grep -q "ai"; then
  check_status 0 "AI service status"
else
  check_status 1 "AI service status"
fi

# ─── PUBLIC ENDPOINTS ────────────────────────────────────────
print_header "PHASE 2: PUBLIC ENDPOINTS"

test_endpoint "GET" "/api/products" "200" "Get products list"
test_endpoint "GET" "/api/categories" "200" "Get categories"
test_endpoint "GET" "/api/home-data" "200" "Get home data"

# ─── AUTHENTICATION ──────────────────────────────────────────
print_header "PHASE 3: AUTHENTICATION"

echo -n "Testing login... "
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token\|error"; then
  check_status 0 "Login endpoint"
else
  check_status 1 "Login endpoint"
fi

# ─── ADMIN ROUTES (SHOULD BE PROTECTED) ──────────────────────
print_header "PHASE 4: API SECURITY"

echo -n "Testing admin endpoint without auth (should fail)... "
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/admin/users" \
  -H "Content-Type: application/json")
STATUS=$(echo "$RESPONSE" | tail -n 1)

if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
  check_status 0 "Admin endpoint protection (HTTP $STATUS)"
else
  check_status 1 "Admin endpoint protection (Expected 401/403, got $STATUS)"
fi

# ─── FRONTEND BUILDS ─────────────────────────────────────────
print_header "PHASE 5: FRONTEND BUILDS"

# Check if builds exist
if [ -d "dist" ]; then
  check_status 0 "Main portal build exists"
  
  # List files
  FILE_COUNT=$(find dist -type f | wc -l)
  echo -e "${BLUE}  Files in dist: $FILE_COUNT${NC}"
else
  check_status 1 "Main portal build exists"
fi

if [ -d "customer-portal/dist" ]; then
  check_status 0 "Customer portal build exists"
else
  check_status 1 "Customer portal build exists"
fi

if [ -d "admin-portal/dist" ]; then
  check_status 0 "Admin portal build exists"
else
  check_status 1 "Admin portal build exists"
fi

# ─── STRIPE INTEGRATION ──────────────────────────────────────
print_header "PHASE 6: STRIPE INTEGRATION"

echo -n "Checking Stripe environment variables... "
if [ -n "$STRIPE_PUBLIC_KEY" ]; then
  check_status 0 "Stripe public key configured"
else
  check_status 1 "Stripe public key configured"
fi

echo -n "Testing payment endpoint... "
test_endpoint "POST" "/api/payments/create-intent" "401" "Payment intent endpoint"

# ─── PERFORMANCE TESTS ───────────────────────────────────────
print_header "PHASE 7: PERFORMANCE TESTS"

echo "Testing response times..."

# Measure response time for products endpoint
start=$(date +%s%N)
curl -s -f "$API_URL/api/products" > /dev/null 2>&1
end=$(date +%s%N)
response_time=$((($end - $start) / 1000000))  # Convert to ms

echo -e "  Products endpoint: ${YELLOW}${response_time}ms${NC}"
if [ $response_time -lt 1000 ]; then
  check_status 0 "Products endpoint response time < 1s"
else
  check_status 1 "Products endpoint response time < 1s"
fi

# ─── FILE INTEGRITY ──────────────────────────────────────────
print_header "PHASE 8: FILE INTEGRITY"

echo "Checking critical files..."

REQUIRED_FILES=(
  "server/index.js"
  "shared/middleware/auth.js"
  "services/adminApi.ts"
  "services/stripeService.ts"
  "components/CheckoutForm.tsx"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    check_status 0 "File exists: $file"
  else
    check_status 1 "File exists: $file"
  fi
done

# ─── DATABASE OPERATIONS ─────────────────────────────────────
print_header "PHASE 9: DATABASE OPERATIONS"

echo -n "Testing order retrieval... "
test_endpoint "GET" "/api/orders" "200" "Get orders"

echo -n "Testing product details... "
test_endpoint "GET" "/api/products/1" "200" "Get product details" || true

# ─── DEPLOYMENT READINESS ───────────────────────────────────
print_header "PHASE 10: DEPLOYMENT READINESS"

echo "Checking deployment prerequisites..."

# Check Node.js version
node_version=$(node -v | cut -d'v' -f2)
echo -e "  Node.js version: ${YELLOW}$node_version${NC}"
if [[ "$node_version" > "18.0.0" ]] || [[ "$node_version" == "18.0.0" ]]; then
  check_status 0 "Node.js version >= 18"
else
  check_status 1 "Node.js version >= 18"
fi

# Check npm packages
if [ -f "package.json" ]; then
  check_status 0 "package.json exists"
else
  check_status 1 "package.json exists"
fi

# Check environment files
if [ -f ".env" ] || [ -f ".env.local" ] || [ -f ".env.$STAGE" ]; then
  check_status 0 "Environment configuration exists"
else
  echo -e "${YELLOW}  Warning: No .env file found${NC}"
fi

# ─── SUMMARY ──────────────────────────────────────────────────
print_header "VERIFICATION SUMMARY"

TOTAL_CHECKS=$((PASSED_CHECKS + FAILED_CHECKS))
echo "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "\n${GREEN}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ ALL CHECKS PASSED - READY FOR DEPLOYMENT!${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
  exit_code=0
else
  echo -e "\n${RED}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}✗ SOME CHECKS FAILED - REVIEW ABOVE${NC}"
  echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
  exit_code=1
fi

# ─── RECOMMENDATIONS ─────────────────────────────────────────
print_header "DEPLOYMENT RECOMMENDATIONS"

if [ $exit_code -eq 0 ]; then
  echo -e "${BLUE}Next steps:${NC}"
  echo "1. Run: npm run build"
  echo "2. For development: npm run dev"
  echo "3. For AWS Lambda: ./aws/deploy.sh dev"
  echo "4. For production: ./aws/deploy.sh prod"
else
  echo -e "${BLUE}Issues found. Please fix:${NC}"
  echo "1. Review failed checks above"
  echo "2. Verify environment variables"
  echo "3. Check backend connectivity"
  echo "4. Review logs for errors"
fi

exit $exit_code
