# GitHub Secrets Setup Guide

The CI/CD workflow in `.github/workflows/deploy.yml` requires GitHub Secrets to be configured for AWS deployment and Slack notifications.

## How to Add GitHub Secrets

1. Go to your GitHub repository: https://github.com/soumyadeepsarkar-2004/SarkarBrothers
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

---

## Required Secrets for Staging Deployment

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key ID for staging | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Access Key for staging | (Keep secret) |
| `AWS_REGION` | AWS region for staging | `ap-south-1` |
| `AWS_S3_CUSTOMER_STAGING` | S3 bucket name for customer portal staging | `sarkarbrothers-customer-staging` |
| `AWS_S3_ADMIN_STAGING` | S3 bucket name for admin portal staging | `sarkarbrothers-admin-staging` |
| `AWS_LAMBDA_FUNCTION_STAGING` | Lambda function name for staging | `sarkarbrothers-api-staging` |
| `AWS_CLOUDFRONT_DIST_STAGING` | CloudFront distribution ID for staging | `E3V4FN2XXXXX` |

---

## Required Secrets for Production Deployment

| Secret Name | Description | Example |
|------------|-------------|---------|
| `PROD_AWS_ACCESS_KEY_ID` | AWS IAM Access Key ID for production | `AKIAIOSFODNN7EXAMPLE` |
| `PROD_AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Access Key for production | (Keep secret) |
| `PROD_AWS_REGION` | AWS region for production | `ap-south-1` |
| `PROD_AWS_S3_CUSTOMER` | S3 bucket name for customer portal production | `sarkarbrothers-customer` |
| `PROD_AWS_S3_ADMIN` | S3 bucket name for admin portal production | `sarkarbrothers-admin` |
| `PROD_AWS_LAMBDA_FUNCTION` | Lambda function name for production | `sarkarbrothers-api-prod` |
| `PROD_AWS_CLOUDFRONT_DIST` | CloudFront distribution ID for production | `E3V4FN2XXXXX` |

---

## Optional Secrets for Notifications

| Secret Name | Description |
|------------|-------------|
| `SLACK_WEBHOOK` | Slack webhook URL for deployment notifications |

### Getting a Slack Webhook URL

1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Navigate to **Incoming Webhooks**
4. Click **Add New Webhook to Workspace**
5. Select your channel and authorize
6. Copy the Webhook URL
7. Add it as `SLACK_WEBHOOK` secret in GitHub

---

## Getting AWS Credentials

### Step 1: Create IAM User

1. Go to AWS Console → IAM → Users
2. Click **Create user**
3. Enter username: `github-actions-staging` (and `github-actions-prod` for production)

### Step 2: Attach Policies

Attach these policies to the user:
- `AmazonS3FullAccess` (for S3 bucket access)
- `AWSLambdaFullAccess` (for Lambda updates)
- `CloudFrontFullAccess` (for cache invalidation)

### Step 3: Generate Access Keys

1. Go to user → **Security credentials**
2. Click **Create access key**
3. Choose **Local code** use case
4. Copy the **Access Key ID** and **Secret Access Key**

### Step 4: Add to GitHub

Add the credentials to GitHub Secrets as listed above.

---

## Verification

Once secrets are added, the workflow should run without warnings. Check:

1. Go to **Actions** tab in your GitHub repository
2. Select the latest workflow run
3. No more "Context access might be invalid" warnings
4. Deployment should proceed to staging/production

---

## Troubleshooting

### Workflow Still Shows Errors

- Verify secret names match exactly (case-sensitive)
- Ensure secrets are in the correct repository (not organization-level)
- Try re-running the workflow after adding secrets

### Deployment Fails with "Access Denied"

- Check IAM policies are correctly attached
- Verify AWS credentials are not expired
- Ensure S3 buckets and Lambda functions exist

### Slack Notifications Don't Work

- Verify `SLACK_WEBHOOK` is correctly formatted
- Check Slack app has permission to post to the channel
- Look at workflow logs for error details

---

## Security Best Practices

✅ **DO:**
- Rotate AWS access keys regularly
- Use separate credentials for staging and production
- Use IAM roles with minimal required permissions
- Review secrets regularly

❌ **DON'T:**
- Commit secrets to version control
- Share webhook URLs in public channels
- Use root AWS account credentials
- Hardcode secrets in yaml files

---

For more information, see:
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
