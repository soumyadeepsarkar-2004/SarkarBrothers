# SarkarBrothers - AWS Lambda Deployment Guide

## Overview

This guide covers deploying the SarkarBrothers application to AWS Lambda using the Serverless Framework.

**Architecture:**
- **Frontend:** AWS S3 + CloudFront
- **Backend API:** AWS Lambda + API Gateway  
- **Database:** MongoDB or DynamoDB
- **Payments:** Stripe
- **Storage:** S3 buckets
- **Logging:** CloudWatch
- **Monitoring:** X-Ray

---

## Prerequisites

### 1. Install Requirements

```bash
# Node.js (v18+)
node --version

# Serverless Framework
npm install -g serverless

# AWS CLI
aws --version

# Docker (for local testing)
# Optional but recommended
```

### 2. AWS Account Setup

```bash
# Create AWS account at https://aws.amazon.com

# Configure credentials
aws configure --profile sarkarbrothers
# Enter your Access Key ID, Secret Access Key, Region (ap-south-1), Output (json)

# Verify configuration
aws sts get-caller-identity --profile sarkarbrothers
```

### 3. Create IAM Role for Deployment

```bash
# Create a deployment user with Lambda, API Gateway, DynamoDB, S3, and Secrets Manager permissions
# AWS Console > IAM > Users > Create User > Add Policies:
# - AWSLambdaFullAccess
# - AmazonAPIGatewayAdministrator
# - AmazonDynamoDBFullAccess
# - AmazonS3FullAccess
# - SecretsManagerReadWrite
```

---

## Setup Environment Variables

### Development Stage

```bash
# Create .env.dev
STAGE=dev
AWS_REGION=ap-south-1
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/sarkarbrothers-dev
JWT_SECRET=dev-secret-key
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
GEMINI_API_KEY=xxx
```

### Production Secrets (AWS Secrets Manager)

For production, store sensitive values in AWS Secrets Manager:

```bash
# Create MongoDB URI secret
aws secretsmanager create-secret \
  --name /sarkarbrothers/prod/mongodb-uri \
  --secret-string 'mongodb+srv://prod-user:password@prod-cluster.mongodb.net/sarkarbrothers' \
  --region ap-south-1 \
  --profile sarkarbrothers

# Create JWT secret
aws secretsmanager create-secret \
  --name /sarkarbrothers/prod/jwt-secret \
  --secret-string 'your-production-jwt-secret' \
  --region ap-south-1 \
  --profile sarkarbrothers

# Create Stripe secrets (use LIVE keys for production)
aws secretsmanager create-secret \
  --name /sarkarbrothers/prod/stripe-secret \
  --secret-string 'sk_live_xxx' \
  --region ap-south-1 \
  --profile sarkarbrothers

aws secretsmanager create-secret \
  --name /sarkarbrothers/prod/stripe-webhook \
  --secret-string 'whsec_prod_xxx' \
  --region ap-south-1 \
  --profile sarkarbrothers

# Create Gemini API key secret
aws secretsmanager create-secret \
  --name /sarkarbrothers/prod/gemini-key \
  --secret-string 'your-gemini-key' \
  --region ap-south-1 \
  --profile sarkarbrothers
```

---

## Deployment

### Deploy to Development

```bash
# Linux/Mac
./aws/deploy.sh dev sarkarbrothers

# Windows
aws\deploy.bat dev sarkarbrothers

# Or manually
serverless deploy --stage dev --aws-profile sarkarbrothers
```

### Deploy to Production

```bash
# Verify all secrets are created first!

# Linux/Mac
./aws/deploy.sh prod sarkarbrothers

# Windows
aws\deploy.bat prod sarkarbrothers

# Or manually
npm run build
serverless deploy \
  --stage prod \
  --aws-profile sarkarbrothers \
  --region ap-south-1 \
  --verbose
```

---

## Post-Deployment

### 1. Get API Endpoint

```bash
serverless info --stage prod --aws-profile sarkarbrothers
# Look for: endpoint: https://xxxxx.execute-api.ap-south-1.amazonaws.com
```

### 2. Update Environment Variables

Update your frontend `.env` file:

```env
VITE_API_URL=https://xxxxx.execute-api.ap-south-1.amazonaws.com
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
```

### 3. Configure Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add new endpoint:
   - URL: `https://xxxxx.execute-api.ap-south-1.amazonaws.com/api/payments/webhook`
   - Events: Select payment-related events
3. Copy Webhook Secret and add to AWS Secrets Manager

### 4. Deploy Frontend

```bash
# Build and deploy to S3
npm run build
aws s3 sync dist/ s3://sarkarbrothers-uploads-prod/ --delete

# CloudFront cache invalidation
aws cloudfront create-invalidation \
  --distribution-id E3V4FN2XXXXX \
  --paths "/*"
```

### 5. Configure Custom Domain (Optional)

```bash
# Install domain plugin
npm install --save-dev serverless-domain-manager

# Create domain in serverless.yml
# Then deploy:
serverless create-domain --stage prod
serverless deploy --stage prod
```

---

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
serverless logs -f api --stage prod --tail --aws-profile sarkarbrothers

# Webhook handler logs
serverless logs -f webhook --stage prod --tail --aws-profile sarkarbrothers

# Scheduled job logs
serverless logs -f cleanupExpiredSessions --stage prod --tail --aws-profile sarkarbrothers
```

### CloudWatch Dashboard

```bash
# Create custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name SarkarBrothersAPI \
  --dashboard-body file://aws/dashboard.json \
  --region ap-south-1 \
  --profile sarkarbrothers
```

### X-Ray Tracing

View traces in AWS Console > X-Ray > Service Map

---

## Scaling & Performance

### Provisioned Concurrency

Set in `serverless.yml`:

```yaml
functions:
  api:
    provisionedConcurrency: 10  # Production
```

### Auto-scaling

Lambda automatically scales, but configure alarms:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name SarkarBrothersHighErrorRate \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

---

## Troubleshooting

### Deployment Fails with "Access Denied"

```bash
# Check IAM permissions
aws iam get-user --profile sarkarbrothers

# Ensure policies are attached to the deployment user
```

### Lambda Timeout

Increase timeout in `serverless.yml`:

```yaml
functions:
  api:
    timeout: 60  # Seconds (max: 900)
```

### Cold Start Issues

Use provisioned concurrency:

```yaml
functions:
  api:
    provisionedConcurrency: 5
```

### Database Connection Fails

- Check MongoDB connection string in Secrets Manager
- Verify IP whitelist in MongoDB Atlas
- Test locally: `serverless offline start`

### Stripe Webhook Errors

```bash
# Test webhook signature
serverless invoke -f webhook \
  --stage prod \
  --data '{"body":"test","headers":{"stripe-signature":"xxx"}}'
```

---

## Cost Optimization

### Lambda Pricing
- **Free Tier:** 1M requests/month, 400,000 GB-seconds
- **Beyond:** $0.20 per 1M requests, $0.0000166667 per GB-second

### Recommendations
1. Use API Gateway caching
2. Set appropriate memory (512 MB recommended)
3. Use DynamoDB on-demand billing
4. Archive old logs to S3 Glacier

### Estimated Monthly Cost (Dev)
- Lambda: <$1 (free tier)
- API Gateway: <$1 (free tier)
- DynamoDB: <$2 (on-demand)
- **Total: <$5/month**

---

## Rollback

```bash
# Revert to previous version
serverless rollback --stage prod --aws-profile sarkarbrothers

# List deployment history
serverless install -g @serverless-plugin-versioning
serverless deploy list --stage prod
```

---

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy-prod.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm install -g serverless
      - run: serverless deploy --stage prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## Support

For issues:
1. Check CloudWatch logs: `serverless logs -f api --tail`
2. Review X-Ray traces
3. Check AWS service health
4. Contact AWS Support

---

**Last Updated:** 2026-04-11  
**Maintained By:** SarkarBrothers Team
