# SarkarBrothers - Complete Deployment Checklist

## Pre-Deployment (Local Development)

### Environment Setup
- [ ] Node.js 18+ installed
- [ ] npm dependencies installed: `npm install`
- [ ] MongoDB/database configured
- [ ] `.env` file created with required variables
- [ ] Git repository initialized and configured

### Backend Verification
- [ ] `npm run server:dev` runs without errors
- [ ] API health endpoint responds: `curl http://localhost:5000/api/health`
- [ ] Database connection verified in logs
- [ ] All middleware installed and configured
  - [ ] Authentication middleware working
  - [ ] Rate limiting active
  - [ ] CORS enabled
  - [ ] Error handling functional

### Frontend Build
- [ ] `npm run build` completes successfully
- [ ] `dist/` folder contains all built files
- [ ] No TypeScript errors: `npm run type-check` (if available)
- [ ] No ESLint errors: `npm run lint` (if available)

### Feature Testing
- [ ] Product listing works
- [ ] Category filtering works
- [ ] Cart functionality works
- [ ] User authentication works
- [ ] Admin panel accessible (with admin account)
- [ ] User management features working
- [ ] Admin reports dashboard loads
- [ ] Stripe payment form appears (in checkout)

### Security Checks
- [ ] JWT tokens properly generate and validate
- [ ] Admin routes protected (return 401/403 without auth)
- [ ] Rate limiting active (test with rapid requests)
- [ ] CORS headers present
- [ ] No console errors or warnings

---

## Pre-Production (Staging Environment)

### AWS Account Preparation
- [ ] AWS account created
- [ ] IAM user created with appropriate permissions
- [ ] AWS CLI configured: `aws configure --profile sarkarbrothers`
- [ ] Credentials verified: `aws sts get-caller-identity --profile sarkarbrothers`

### Secrets Manager Setup
- [ ] MongoDB connection string created
- [ ] JWT secret created
- [ ] Stripe API keys created (test keys for staging)
- [ ] Gemini API key created
- [ ] All secrets stored in AWS Secrets Manager

### Serverless Framework Setup
- [ ] Serverless Framework installed: `npm install -g serverless`
- [ ] `serverless.yml` configured
- [ ] Plugins installed: `npm install --save-dev serverless-plugin-tracing serverless-offline serverless-http`
- [ ] DynamoDB tables configured
- [ ] S3 buckets configured

### Lambda Deployment
- [ ] Staging deployment successful: `./aws/deploy.sh staging sarkarbrothers`
- [ ] API Gateway endpoint created and accessible
- [ ] Lambda functions deployed:
  - [ ] `api` function
  - [ ] `webhook` function
  - [ ] `cleanupExpiredSessions` function
  - [ ] `updateOrderStatuses` function

### Environment Variables Updated
- [ ] Frontend `.env` updated with API Gateway URL
- [ ] Stripe webhook configured in Stripe Dashboard
- [ ] MongoDB whitelisted for Lambda IPs
- [ ] All environment variables verified

### Integration Testing
- [ ] Health check endpoint works
  ```bash
  curl https://xxxxx.execute-api.ap-south-1.amazonaws.com/api/health
  ```
- [ ] Products endpoint works
- [ ] Authentication works with Lambda
- [ ] Admin endpoints properly protected
- [ ] Payment flow tested (Stripe test keys)
- [ ] Webhooks received and processed

### Performance Testing
- [ ] Cold start time acceptable (<5s)
- [ ] Response times under 2s
- [ ] Concurrent requests handled properly
- [ ] Database queries optimized
- [ ] CDN/caching headers correct

### Monitoring Setup
- [ ] CloudWatch logs visible
- [ ] X-Ray tracing enabled
- [ ] Alarms configured for errors
- [ ] Dashboard created
- [ ] Notifications set up

---

## Production Deployment

### Final Security Review
- [ ] All secrets using Stripe LIVE keys
- [ ] JWT secrets strong and random
- [ ] Database credentials secure
- [ ] No personal data in logs
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] CORS limited to known origins

### Production Secrets Configured
- [ ] MongoDB production URI
- [ ] JWT production secret
- [ ] Stripe live api key
- [ ] Stripe webhook secret (from Stripe Dashboard)
- [ ] Gemini API key (if available)

### Production Deployment
- [ ] Final build tested: `npm run build`
- [ ] Production deployment: `./aws/deploy.sh prod sarkarbrothers`
- [ ] API Gateway URL retrieved
- [ ] Lambda functions verified deployed
- [ ] DynamoDB auto-scaling configured
- [ ] Scheduled jobs enabled

### Domain & DNS
- [ ] Custom domain purchased
- [ ] DNS configured
- [ ] SSL certificate obtained (ACM)
- [ ] Custom domain mapped to API Gateway (optional)
- [ ] Stripe webhook URL updated

### Production Frontend Setup
- [ ] Frontend deployed to S3
  ```bash
  npm run build
  aws s3 sync dist/ s3://sarkarbrothers-uploads-prod/ --delete
  ```
- [ ] CloudFront distribution created
- [ ] Cache invalidation rules set
- [ ] CDN HTTPS configured

### Database Migration
- [ ] Production database seeded with initial data
- [ ] Data migration from staging completed (if needed)
- [ ] Backup strategy configured
- [ ] Database recovery plan documented

### Payment Processing
- [ ] Stripe live mode verified
- [ ] Webhook endpoints configured
- [ ] Payment confirmation emails set up
- [ ] Refund process documented
- [ ] Tax calculation applied (if applicable)

### Email & Notifications
- [ ] Order confirmation emails configured
- [ ] Payment receipt emails set up
- [ ] Admin alert emails configured
- [ ] SMS notifications tested (if using)

---

## Post-Deployment Monitoring

### Week 1 (Launch)
- [ ] Monitor logs hourly for errors
- [ ] Check CloudWatch metrics
- [ ] Verify all portals accessible
- [ ] Test checkout flow with real payment (small amount)
- [ ] Monitor customer feedback
- [ ] Response time < 2s maintained
- [ ] No 5xx errors

### Week 1-2 (Stabilization)
- [ ] Error rate < 0.1%
- [ ] 99.9% uptime achieved
- [ ] Database performance optimal
- [ ] No memory leaks detected
- [ ] Customer complaints addressed
- [ ] Load testing results acceptable

### Ongoing Monitoring
- [ ] Daily log review
- [ ] Weekly performance report
- [ ] Monthly cost analysis
- [ ] Security patches applied
- [ ] Database backups verified
- [ ] Disaster recovery tested quarterly

---

## Rollback Plan

### If Issues Found
1. [ ] Identify issue in logs/monitoring
2. [ ] Notify stakeholders
3. [ ] Revert Lambda functions: `serverless rollback --stage prod`
4. [ ] Verify previous version working
5. [ ] Post-mortem analysis

### Database Issues
1. [ ] Verify backup exists
2. [ ] Restore from backup
3. [ ] Verify data integrity
4. [ ] Notify affected users

---

## Success Criteria

✅ **All items checked**
✅ **No blocking errors**
✅ **Performance metrics met**
✅ **Security hardened**
✅ **Customer feedback positive**
✅ **Monitoring/Alerts working**

---

## Support Contacts

- **AWS Support:** [AWS Support Ticket]
- **Stripe Support:** https://support.stripe.com
- **Team Lead:** [Contact Info]
- **On-Call Rotation:** [Details]

---

## Document History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-04-11 | 1.0 | Initial checklist | SarkarBrothers Team |

---

**Deployment Manager:** _____________________  
**Date:** _____________  
**Approved By:** _____________________  

For issues or questions, refer to `aws/DEPLOYMENT_GUIDE.md`
