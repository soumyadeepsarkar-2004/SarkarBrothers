# 🚀 SarkarBrothers - Production Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS INFRASTRUCTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CloudFront CDN                                                  │
│  ├── customer.sarkarbrothers.com → S3 (React SPA)              │
│  ├── admin.sarkarbrothers.com → S3 (React SPA)                 │
│  └── api.sarkarbrothers.com → API Gateway                      │
│                                                                   │
│  API Gateway                                                     │
│  └── /api/* → Lambda Function (Node.js)                        │
│                                                                   │
│  AWS Lambda                                                      │
│  └── server/index-v2.js (2100 lines, Node.js 22)              │
│      ├── Role-based auth (JWT)                                  │
│      ├── Portal detection (customer/admin)                      │
│      ├── Stripe webhook handler                                 │
│      └── MongoDB queries (row-level security)                   │
│                                                                   │
│  MongoDB Atlas (Shared DB)                                       │
│  └── Row-level security via role-based queries                 │
│                                                                   │
│  S3 Buckets                                                      │
│  ├── sarkarbrothers-customer/ (customer portal bundle)          │
│  ├── sarkarbrothers-admin/ (admin portal bundle)               │
│  └── sarkarbrothers-images/ (product images)                   │
│                                                                   │
│  Stripe                                                          │
│  ├── Payment Intent creation                                    │
│  └── Webhook: payment_intent.succeeded/failed                  │
│                                                                   │
│  CloudWatch                                                      │
│  └── Logs from Lambda + Error tracking                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: Local Development Setup

### Prerequisites
```bash
# Required
- Node.js v22+
- MongoDB Atlas account
- Stripe account (test mode)
- AWS account (for staging/prod)
```

### Installation
```bash
# 1. Clone and install dependencies
git clone https://github.com/yourusername/sarkarbrothers.git
cd SarkarBrothers
npm install

# 2. Install portal dependencies
cd customer-portal && npm install && cd ..
cd admin-portal && npm install && cd ..

# 3. Create .env from .env.example
cp .env.example .env

# 4. Update .env with your credentials:
# MONGODB_URI=your_mongodb_atlas_uri
# STRIPE_SECRET_KEY=sk_test_...
# JWT_SECRET=generate-a-random-32-char-string
```

### Run Locally
```bash
# Terminal 1: Backend + Both Portals (Concurrently)
npm run dev:portals

# Or run separately:
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Customer Portal
npm run dev:customer

# Terminal 3: Admin Portal
npm run dev:admin
```

**Access Points:**
- Customer Portal: http://localhost:3001
- Admin Portal: http://localhost:3002
- API Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health

### Test Login
```javascript
// Customer Portal
Email: customer@sarkarbrothers.com
Password: test123456
Portal: customer

// Admin Portal
Email: admin@sarkarbrothers.com
Password: test123456
Portal: admin
```

## Phase 2: Staging Deployment (AWS Lambda)

### Prerequisites
```bash
- AWS CLI configured: aws configure
- SAM (Serverless Application Model): brew install aws-sam-cli
- Docker (for local Lambda testing)
```

### Build Portals
```bash
# Build both React apps
npm run build:portals

# Output directories:
# - customer-portal/dist/
# - admin-portal/dist/
```

### Deploy to S3
```bash
# Create S3 buckets (if not exists)
aws s3 mb s3://sarkarbrothers-customer
aws s3 mb s3://sarkarbrothers-admin

# Deploy customer portal
aws s3 sync customer-portal/dist s3://sarkarbrothers-customer/ \
  --delete \
  --cache-control "max-age=31536000,public" \
  --expires 2030-01-01T00:00:00Z

# Deploy admin portal
aws s3 sync admin-portal/dist s3://sarkarbrothers-admin/ \
  --delete \
  --cache-control "max-age=31536000,public"

# Invalidate CloudFront cache (if using CDN)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Deploy Backend to Lambda

#### Option A: Using AWS Console (Simple)
1. Go to AWS Lambda Console
2. Create new function: "sarkarbrothers-api"
3. Runtime: Node.js 22.x
4. Upload ZIP of `server/` folder
5. Set environment variables (see .env)
6. Create API Gateway trigger
7. Test with: `curl https://api.staging.sarkarbrothers.com/api/health`

#### Option B: Using SAM CLI (Recommended)
```bash
# Create template.yaml
sam build
sam deploy --guided

# Guided prompts:
# - Function name: sarkarbrothers-api
# - Runtime: nodejs22.x
# - Capabilities: CAPABILITY_IAM
```

### Lambda Environment Variables
```bash
NODE_ENV=staging
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-production-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
GEMINI_API_KEY=...
CUSTOMER_PORTAL_URL=https://customer.staging.sarkarbrothers.com
ADMIN_PORTAL_URL=https://admin.staging.sarkarbrothers.com
```

### Configure CloudFront (CDN)
```bash
# Create CloudFront distribution pointing to:
# - customer.sarkarbrothers.com → S3: sarkarbrothers-customer
# - admin.sarkarbrothers.com → S3: sarkarbrothers-admin
# - api.sarkarbrothers.com → API Gateway: sarkarbrothers-api

# Configure SSL: Use AWS Certificate Manager (free)
```

### Test Staging Environment
```bash
# Customer Portal
https://customer.staging.sarkarbrothers.com

# Admin Portal
https://admin.staging.sarkarbrothers.com

# API Health Check
curl https://api.staging.sarkarbrothers.com/api/health

# Test Login
curl -X POST https://api.staging.sarkarbrothers.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "test123456",
    "portal": "customer"
  }'

# Response should include JWT token
```

## Phase 3: Production Deployment

### Domain Setup
```bash
# 1. Register domains (Route53)
- customer.sarkarbrothers.com
- admin.sarkarbrothers.com
- api.sarkarbrothers.com

# 2. Create ACM certificate (free, auto-renewal)
- *.sarkarbrothers.com

# 3. Point DNS to CloudFront + API Gateway
```

### Pre-Launch Checklist
```
□ All environment variables set to production values
□ HTTPS/SSL enabled on all domains
□ CORS properly configured
□ Rate limiting active (300/15min for API)
□ Stripe live keys configured
□ MongoDB backups enabled
□ CloudWatch alarms configured
□ Error logging to Sentry
□ Load testing passed (100+ concurrent users)
□ Security audit passed
□ Admin & Customer portals fully isolated
□ Test order → payment flow end-to-end
□ Stripe webhook working
□ Admin analytics dashboard working
```

### Go Live
```bash
# 1. Verify all services
npm run test:production

# 2. Deploy backend to Lambda (production mode)
NODE_ENV=production npm run deploy:lambda

# 3. Deploy portals to S3
npm run build:portals
npm run deploy:production

# 4. Run smoke tests
curl https://api.sarkarbrothers.com/api/health
curl https://customer.sarkarbrothers.com
curl https://admin.sarkarbrothers.com

# 5. Announce launch
echo "🚀 SarkarBrothers is LIVE!"
```

## Phase 4: Post-Launch Operations

### Monitoring
```bash
# CloudWatch Dashboard
- Lambda execution time
- Error rate
- Concurrent executions

# MongoDB Atlas
- Connection pool utilization
- Query performance
- Backup status

# Stripe Dashboard
- Payment success rate
- Failed payments
- Webhook delivery
```

### Scaling
```bash
# Lambda Auto-Scaling
- Concurrent executions: 500 → 1000 (for 10K DAU)
- Memory: 1024 MB (current) → 3008 MB (if needed)
- Timeout: 60s (current) → 30s (optimize)

# Database Optimization
- Add indexes on frequently queried fields
- Enable MongoDB Atlas auto-scaling
- Consider read replicas if read-heavy
```

### Security Updates
```bash
# Weekly
npm audit
npm update

# Monthly
- Rotate JWT_SECRET (graceful migration)
- Review CloudWatch logs for anomalies
- Update IP whitelists if needed

# Quarterly
- Security audit
- Dependency vulnerability scan
- Load test with latest traffic patterns
```

## Troubleshooting

### Lambda Function Timeout
```bash
# Increase timeout in Lambda console: 60s → 300s
# Or optimize Node.js code for faster execution
```

### Portal Not Loading
```bash
# Check S3 bucket -> CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_ID \
  --paths "/*"
```

### Stripe Webhook Not Triggering
```bash
# Verify webhook URL in Stripe Dashboard
# Check Lambda CloudWatch logs for errors
# Test with: stripe trigger payment_intent.succeeded
```

### High MongoDB Query Latency
```bash
# Check indexes: db.orders.getIndexes()
# Add index if missing: db.orders.createIndex({customerId: 1})
# Check connection pool size
```

## Cost Estimation (AWS - 10K DAU)

| Service | Monthly | Notes |
|---------|---------|-------|
| Lambda | $20 | 1M requests/month, 2M GB-seconds |
| S3 | $5 | Static files storage + requests |
| CloudFront | $10 | Data transfer out |
| Data Transfer | $5 | Lambda → MongoDB |
| RDS (optional) | $30 | If using Aurora instead of MongoDB Atlas |
| **MongoDB Atlas** | $57 | Shared cluster, 100GB storage |
| **Total** | **$127/month** | Within $100-200 budget |

**Cost Optimization:**
- Use Lambda free tier (1M requests/month)
- Use S3 free tier for static files
- Use MongoDB Atlas free tier for prototyping
- Enable caching on CloudFront
- Monitor unused resources

---

## Files Modified/Created

### New Files
- `admin-portal/` - Separate admin React app
- `customer-portal/` - Separate customer React app
- `shared/types/index.ts` - Shared TypeScript types
- `shared/middleware/auth.ts` - Role-based auth middleware
- `server/index-v2.js` - Production dual-portal backend
- `.github/workflows/deploy.yml` - GitHub Actions (upcoming)

### Key Updates
- `.env.example` - Comprehensive deployment guide
- `package.json` - New scripts for dual-portal development
- `vite.config.ts` - Maintain existing customer app

### No Longer Used (But Kept)
- `server/index.js` - Legacy v1 (use index-v2.js)
- Root `vite.config.ts` - Superseded by portal configs

---

## Support & Resources

| Resource | Link |
|----------|------|
| AWS Lambda Best Practices | https://docs.aws.amazon.com/lambda |
| Stripe API Reference | https://stripe.com/docs/api |
| MongoDB Row-Level Security | https://www.mongodb.com/docs/manual/reference/field-level-encryption |
| React 19 Docs | https://react.dev |
| Vite Documentation | https://vitejs.dev |

---

**Last Updated:** 2024  
**Next Review:** After first 1K users / Launch + 1 month
