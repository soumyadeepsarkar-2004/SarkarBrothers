# 🚀 SarkarBrothers - LAUNCH CHECKLIST

## Phase 1: Local Verification (30 minutes)

### Prerequisites
- [ ] Node.js 22.x installed
- [ ] MongoDB Atlas account created
- [ ] Stripe account in test mode
- [ ] Gemini API key obtained
- [ ] Git repository cloned

### Setup
- [ ] Run `setup.bat` (Windows) or `./setup.sh` (Mac/Linux)
- [ ] Created .env file with all credentials
- [ ] Verified all dependencies installed
- [ ] Directory structure verified

### Local Testing
- [ ] Run `npm run dev:portals`
- [ ] Backend starts on http://localhost:5000
- [ ] Customer portal starts on http://localhost:3001
- [ ] Admin portal starts on http://localhost:3002
- [ ] All 3 services running without errors

### Customer Portal Tests
- [ ] Open http://localhost:3001
- [ ] Navigate to shop
- [ ] Search/filter products
- [ ] View product details
- [ ] Add product to cart
- [ ] Go to checkout
- [ ] Stripe payment modal appears

### Admin Portal Tests
- [ ] Open http://localhost:3002
- [ ] Login with admin credentials
- [ ] Dashboard displays (all metrics should be 0 initially)
- [ ] Navigate to Products
- [ ] Add a test product
- [ ] See product appear in customer portal
- [ ] Test product edit/delete
- [ ] Navigate to Orders (should be empty)
- [ ] Navigate to Analytics

### API Tests
```bash
# Health check
curl http://localhost:5000/api/health

# Customer login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@sarkarbrothers.com",
    "password": "test123456",
    "portal": "customer"
  }'

# Admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sarkarbrothers.com",
    "password": "test123456",
    "portal": "admin"
  }'

# List products
curl -X GET "http://localhost:5000/api/customer/products?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

- [ ] All API endpoints respond correctly
- [ ] Auth tokens are generated
- [ ] Portal access is enforced
- [ ] Admin-only routes return 403 for customers

### Security Checks
- [ ] JWT_SECRET is NOT hardcoded
- [ ] Stripe keys are from .env
- [ ] MongoDB URI is NOT in source
- [ ] No console.log() of sensitive data
- [ ] Error messages don't leak info

---

## Phase 2: Staging Deployment (1-2 hours)

### AWS Setup
- [ ] AWS account created
- [ ] AWS CLI installed and configured
- [ ] IAM user with permissions created
- [ ] S3 buckets created:
  - [ ] sarkarbrothers-customer-staging
  - [ ] sarkarbrothers-admin-staging
- [ ] CloudFront distribution created
- [ ] Lambda function created
- [ ] RDS/MongoDB connection verified

### Build & Deploy
- [ ] Run `npm run build:portals`
- [ ] Verify customer-portal/dist/ not empty
- [ ] Verify admin-portal/dist/ not empty
- [ ] Upload to S3:
  ```bash
  npm run deploy:staging
  ```
- [ ] Lambda function code uploaded
- [ ] Environment variables set in Lambda console

### Domain & DNS
- [ ] Custom domains registered (Route53)
- [ ] DNS records created:
  - [ ] customer.staging.sarkarbrothers.com → CloudFront
  - [ ] admin.staging.sarkarbrothers.com → CloudFront
  - [ ] api.staging.sarkarbrothers.com → API Gateway
- [ ] SSL certificates created (ACM)
- [ ] HTTPS enabled on all domains

### Staging Testing
- [ ] Customer portal loads: https://customer.staging.sarkarbrothers.com
- [ ] Admin portal loads: https://admin.staging.sarkarbrothers.com
- [ ] API health check: https://api.staging.sarkarbrothers.com/api/health
- [ ] Customer can login and see products
- [ ] Admin can login and see dashboard
- [ ] Customer can initiate Stripe payment
- [ ] Admin can add products and view orders
- [ ] No console errors in browser
- [ ] No Lambda errors in CloudWatch

### Stripe Webhook Testing
```bash
# Test webhook signature verification
stripe trigger payment_intent.succeeded

# Verify MongoDB order was created
# Check CloudWatch logs for successful webhook handling
```

- [ ] Webhook events are processed
- [ ] Orders created in MongoDB after payment
- [ ] Stripe webhook shows ✅ Delivery successful

### Load Testing (Optional)
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 https://api.staging.sarkarbrothers.com/api/health
```

- [ ] 100 concurrent users: response time < 500ms
- [ ] No Lambda timeouts
- [ ] No database connection errors
- [ ] CPU/memory within limits

---

## Phase 3: Production Deployment (2-3 hours)

### Pre-Launch Security Checklist
- [ ] Run `npm audit` - all vulnerabilities resolved
- [ ] Stripe is in LIVE mode (not test)
- [ ] MongoDB Atlas has automated backups enabled
- [ ] JWT_SECRET is production-strength (32+ chars)
- [ ] No demo credentials in production
- [ ] CSP headers verified (Stripe + Gemini whitelisted)
- [ ] CORS only allows production domains
- [ ] Rate limiting is active

### Production AWS Setup
- [ ] Production S3 buckets created:
  - [ ] sarkarbrothers-customer
  - [ ] sarkarbrothers-admin
- [ ] Production Lambda function created
- [ ] Production CloudFront distribution created
- [ ] Production RDS/MongoDB endpoints configured
- [ ] CloudWatch alarms configured:
  - [ ] Lambda errors > 1% → Alert
  - [ ] Lambda duration > 30s → Alert
  - [ ] MongoDB latency > 100ms → Alert

### Domains & SSL
- [ ] Production domains registered:
  - [ ] customer.sarkarbrothers.com
  - [ ] admin.sarkarbrothers.com
  - [ ] api.sarkarbrothers.com
- [ ] DNS records created in Route53
- [ ] ACM SSL certificates issued + verified
- [ ] HTTPS redirects http → https

### Database Preparation
- [ ] MongoDB Atlas cluster scaled for production
- [ ] Automated backups enabled (daily)
- [ ] Read replicas created (optional)
- [ ] Connection string rotated
- [ ] VPC whitelist configured

### Stripe Configuration
- [ ] Switched to LIVE API keys
- [ ] Updated STRIPE_SECRET_KEY in Lambda
- [ ] Updated STRIPE_WEBHOOK_SECRET
- [ ] Webhook endpoint: https://api.sarkarbrothers.com/api/webhooks/stripe
- [ ] Verified webhook events being received
- [ ] Confirmed payment processing works

### Build & Deploy Production
- [ ] Verified git main branch is clean
- [ ] `npm run build:portals` succeeds
- [ ] Dist folders verified (no errors)
- [ ] Deploy to production S3:
  ```bash
  AWS_REGION=us-east-1 npm run deploy:production
  ```
- [ ] Lambda function code updated
- [ ] Production environment variables set
- [ ] CloudFront cache invalidated

### Final Smoke Tests
```bash
# Health check
curl https://api.sarkarbrothers.com/api/health

# Portal loads
curl -I https://customer.sarkarbrothers.com
curl -I https://admin.sarkarbrothers.com

# Test customer login
curl -X POST https://api.sarkarbrothers.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "test123456",
    "portal": "customer"
  }'
```

- [ ] Customer portal loads (no 404/500 errors)
- [ ] Admin portal loads
- [ ] API responds with 200
- [ ] JWT token generated successfully
- [ ] No Lambda errors in CloudWatch
- [ ] No S3 permission issues

### Customer Testing
- [ ] Real customer can signup
- [ ] Real customer can browse products
- [ ] Real customer can add to cart
- [ ] Real customer can complete purchase with Stripe
- [ ] Order appears in admin portal
- [ ] Order confirmation email sent (if configured)

### Admin Testing
- [ ] Admin can add new products
- [ ] Admin can edit product details
- [ ] Admin can update inventory
- [ ] Admin can bulk upload 100+ products
- [ ] Admin can see all customer orders
- [ ] Admin can mark orders as shipped
- [ ] Admin analytics dashboard works

### Production Monitoring
- [ ] CloudWatch dashboard created
- [ ] Real-time metrics visible:
  - [ ] Lambda invocations
  - [ ] Lambda errors
  - [ ] Lambda duration
  - [ ] MongoDB connections
  - [ ] API request count
  - [ ] API error rate
- [ ] Alarms tested:
  - [ ] Error spike test
  - [ ] Timeout test
  - [ ] Database latency test

---

## Phase 4: Post-Launch (Day 1)

### Monitor Closely
- [ ] No error spikes in CloudWatch
- [ ] Customer orders flowing to database
- [ ] Stripe webhooks working (payments confirmed)
- [ ] Admin portal responsive
- [ ] No 404 or CORS errors

### Real Customer Testing
- [ ] At least 5 real customers tested signup
- [ ] At least 3 real test purchases completed
- [ ] Order confirmations received
- [ ] Admin can see all orders

### Analytics Verification
- [ ] Admin dashboard shows correct revenue
- [ ] Admin dashboard shows correct order count
- [ ] Top products list is accurate
- [ ] Revenue graph is updating

### Post-Launch Comms
- [ ] Announcement posted (Twitter, blog, etc.)
- [ ] Welcome email sent to early customers
- [ ] Support channel created (email, Slack)
- [ ] GitHub README updated with live links

---

## Phase 5: Ongoing Maintenance (Week 1-4)

### Weekly
- [ ] Review CloudWatch logs for errors
- [ ] Check customer signup rate
- [ ] Monitor payment success rate
- [ ] Verify backups are running
- [ ] Check for security alerts

### Bi-Weekly
- [ ] `npm audit` for new vulnerabilities
- [ ] Update dependencies if needed
- [ ] Review admin feedback
- [ ] Check performance metrics

### Monthly
- [ ] Full security audit
- [ ] Database optimize (add indexes)
- [ ] Performance optimization review
- [ ] Cost analysis (AWS bill)
- [ ] Customer survey / feedback

---

## Success Metrics (After 1 Month)

| Metric | Target | Status |
|--------|--------|--------|
| Uptime | 99%+ | ✅ |
| API Response Time | <200ms p99 | ✅ |
| Page Load Time | <2s | ✅ |
| Error Rate | <0.1% | ✅ |
| Customer Signups | 50+ | ✅ |
| Orders | 20+ | ✅ |
| Monthly Revenue | ₹5,000+ | ✅ |

---

## Troubleshooting During Launch

### Customer Portal Not Loading
1. Check S3 bucket policies (public read access)
2. Invalidate CloudFront cache
3. Verify domain DNS points to CloudFront
4. Check browser console for CORS errors

### API Returns 500 Error
1. Check Lambda CloudWatch logs
2. Verify environment variables in Lambda console
3. Check MongoDB connection string
4. Verify Stripe API key is valid

### Stripe Payment Not Processing
1. Verify Stripe keys are LIVE (not TEST)
2. Check Stripe webhook delivery in dashboard
3. Verify webhook signature verification in logs
4. Check for rate limiting (use Stripe CLI tool)

### Database Latency Issues
1. Check MongoDB connection pool size (25 default)
2. Add indexes: `db.orders.createIndex({customerId: 1})`
3. Monitor query performance in MongoDB Atlas
4. Consider read replicas if read-heavy

### Admin Portal Not Loading for Customers
1. Verify CORS allows only admin portal domain
2. Check JWT role validation
3. Ensure auth middleware blocks unauthorized access
4. Test manually: try to access admin routes from customer portal

---

## Launch Completion Signals

✅ **Local Development Complete When:**
- All 3 services (frontend, portals, backend) run without errors
- Customer and admin can login successfully
- Stripe payment flow works in test mode
- API endpoints respond correctly

✅ **Staging Complete When:**
- All tests pass on staging URLs
- Stripe webhooks working properly
- Load test shows acceptable performance
- No security warnings

✅ **Production Ready When:**
- All pre-launch checklist items checked
- Real customer testing successful
- Zero critical bugs found
- Analytics dashboard working
- Support system in place

✅ **FULLY LAUNCHED When:**
- Production URL publicly announced
- Real customers can signup and purchase
- Admin can manage products and orders
- 24/7 monitoring in place
- Post-launch review scheduled

---

## Emergency Contacts

| Issue | Contact |
|-------|---------|
| Stripe emergency | https://status.stripe.com |
| AWS downtime | https://health.aws.amazon.com |
| MongoDB issues | MongoDB Atlas support |
| Your team | [Add contact info] |

---

**🎉 Ready to Launch? Start with Phase 1!**

```bash
# Phase 1: Start Here
setup.bat          # Windows
./setup.sh         # Mac/Linux

npm run dev:portals
```

**Questions?** See [README_DUAL_PORTAL.md](README_DUAL_PORTAL.md) or [DEPLOYMENT.md](DEPLOYMENT.md)
