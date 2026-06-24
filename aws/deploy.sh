#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# AWS LAMBDA DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGE=${1:-dev}
SERVICE_NAME="sarkarbrothers-api"
AWS_REGION="ap-south-1"
PROFILE=${2:-default}

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SARKARBROTHERS - AWS LAMBDA DEPLOYMENT${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "Stage: ${YELLOW}${STAGE}${NC}"
echo -e "Region: ${YELLOW}${AWS_REGION}${NC}"
echo -e "Profile: ${YELLOW}${PROFILE}${NC}"
echo ""

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
  echo -e "${RED}✗ Serverless Framework not found${NC}"
  echo "Install with: npm install -g serverless"
  exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity --profile $PROFILE &> /dev/null; then
  echo -e "${RED}✗ AWS credentials not configured for profile: $PROFILE${NC}"
  echo "Configure with: aws configure --profile $PROFILE"
  exit 1
fi

# Build frontend assets
echo -e "\n${BLUE}[1/4] Building frontend assets...${NC}"
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
  echo -e "${RED}✗ Frontend build failed${NC}"
  exit 1
fi

# Install serverless plugins
echo -e "\n${BLUE}[2/4] Installing serverless plugins...${NC}"
npm install --save-dev serverless-plugin-tracing serverless-offline serverless-http 2>&1 | grep -E "added|up to date" || true
echo -e "${GREEN}✓ Plugins installed${NC}"

# Upload secrets to AWS Secrets Manager (optional, for production)
if [ "$STAGE" = "prod" ]; then
  echo -e "\n${BLUE}[3/4] Verifying production secrets...${NC}"
  REQUIRED_SECRETS=(
    "/$SERVICE_NAME/$STAGE/mongodb-uri"
    "/$SERVICE_NAME/$STAGE/jwt-secret"
    "/$SERVICE_NAME/$STAGE/stripe-secret"
    "/$SERVICE_NAME/$STAGE/stripe-webhook"
    "/$SERVICE_NAME/$STAGE/gemini-key"
  )
  
  for SECRET in "${REQUIRED_SECRETS[@]}"; do
    if aws secretsmanager describe-secret --secret-id "$SECRET" --region $AWS_REGION --profile $PROFILE &> /dev/null; then
      echo -e "${GREEN}✓ $SECRET exists${NC}"
    else
      echo -e "${RED}✗ $SECRET not found in AWS Secrets Manager${NC}"
      echo "  Create with: aws secretsmanager create-secret --name $SECRET --secret-string 'value' --region $AWS_REGION --profile $PROFILE"
      exit 1
    fi
  done
fi

# Deploy to AWS Lambda
echo -e "\n${BLUE}[4/4] Deploying to AWS Lambda...${NC}"
serverless deploy \
  --stage $STAGE \
  --region $AWS_REGION \
  --verbose \
  --aws-profile $PROFILE

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ DEPLOYMENT SUCCESSFUL!${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
  
  # Get deployment info
  echo -e "\n${BLUE}Deployment Information:${NC}"
  serverless info --stage $STAGE --region $AWS_REGION --aws-profile $PROFILE
  
  echo -e "\n${YELLOW}Next Steps:${NC}"
  echo "1. Update frontend .env with your API Gateway URL"
  echo "2. Configure custom domain (optional): serverless create-domain --stage $STAGE"
  echo "3. Monitor logs: serverless logs -f api --stage $STAGE --tail"
else
  echo -e "\n${RED}✗ Deployment failed${NC}"
  exit 1
fi
