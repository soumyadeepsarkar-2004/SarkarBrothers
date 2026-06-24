@echo off
REM ═══════════════════════════════════════════════════════════════
REM GITHUB SECRETS AUTO-SETUP HELPER (Windows)
REM ═══════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

set REPO=soumyadeepsarkar-2004/SarkarBrothers

echo ═══════════════════════════════════════════════════════════════
echo GitHub Secrets Setup for SarkarBrothers CI/CD
echo ═══════════════════════════════════════════════════════════════
echo.
echo Using repository: %REPO%
echo.

REM Check if gh CLI is installed
where gh >nul 2>&1
if errorlevel 1 (
  echo ❌ GitHub CLI (gh) not found
  echo Install from: https://cli.github.com
  exit /b 1
)

REM Check if authenticated
gh auth status >nul 2>&1
if errorlevel 1 (
  echo ❌ Not authenticated with GitHub
  echo Run: gh auth login
  exit /b 1
)

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo STAGING SECRETS
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

set /p AWS_ACCESS_KEY_ID="Enter AWS_ACCESS_KEY_ID (staging): "
if not "!AWS_ACCESS_KEY_ID!"=="" (
  echo !AWS_ACCESS_KEY_ID! | gh secret set AWS_ACCESS_KEY_ID --repo %REPO%
  echo ✅ AWS_ACCESS_KEY_ID set
)

set /p AWS_SECRET_ACCESS_KEY="Enter AWS_SECRET_ACCESS_KEY (staging): "
if not "!AWS_SECRET_ACCESS_KEY!"=="" (
  echo !AWS_SECRET_ACCESS_KEY! | gh secret set AWS_SECRET_ACCESS_KEY --repo %REPO%
  echo ✅ AWS_SECRET_ACCESS_KEY set
)

set /p AWS_REGION="Enter AWS_REGION (staging, default: ap-south-1): "
if "!AWS_REGION!"=="" set AWS_REGION=ap-south-1
echo !AWS_REGION! | gh secret set AWS_REGION --repo %REPO%
echo ✅ AWS_REGION set

set /p AWS_S3_CUSTOMER_STAGING="Enter AWS_S3_CUSTOMER_STAGING: "
if not "!AWS_S3_CUSTOMER_STAGING!"=="" (
  echo !AWS_S3_CUSTOMER_STAGING! | gh secret set AWS_S3_CUSTOMER_STAGING --repo %REPO%
  echo ✅ AWS_S3_CUSTOMER_STAGING set
)

set /p AWS_S3_ADMIN_STAGING="Enter AWS_S3_ADMIN_STAGING: "
if not "!AWS_S3_ADMIN_STAGING!"=="" (
  echo !AWS_S3_ADMIN_STAGING! | gh secret set AWS_S3_ADMIN_STAGING --repo %REPO%
  echo ✅ AWS_S3_ADMIN_STAGING set
)

set /p AWS_LAMBDA_FUNCTION_STAGING="Enter AWS_LAMBDA_FUNCTION_STAGING: "
if not "!AWS_LAMBDA_FUNCTION_STAGING!"=="" (
  echo !AWS_LAMBDA_FUNCTION_STAGING! | gh secret set AWS_LAMBDA_FUNCTION_STAGING --repo %REPO%
  echo ✅ AWS_LAMBDA_FUNCTION_STAGING set
)

set /p AWS_CLOUDFRONT_DIST_STAGING="Enter AWS_CLOUDFRONT_DIST_STAGING: "
if not "!AWS_CLOUDFRONT_DIST_STAGING!"=="" (
  echo !AWS_CLOUDFRONT_DIST_STAGING! | gh secret set AWS_CLOUDFRONT_DIST_STAGING --repo %REPO%
  echo ✅ AWS_CLOUDFRONT_DIST_STAGING set
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo PRODUCTION SECRETS
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

set /p PROD_AWS_ACCESS_KEY_ID="Enter PROD_AWS_ACCESS_KEY_ID: "
if not "!PROD_AWS_ACCESS_KEY_ID!"=="" (
  echo !PROD_AWS_ACCESS_KEY_ID! | gh secret set PROD_AWS_ACCESS_KEY_ID --repo %REPO%
  echo ✅ PROD_AWS_ACCESS_KEY_ID set
)

set /p PROD_AWS_SECRET_ACCESS_KEY="Enter PROD_AWS_SECRET_ACCESS_KEY: "
if not "!PROD_AWS_SECRET_ACCESS_KEY!"=="" (
  echo !PROD_AWS_SECRET_ACCESS_KEY! | gh secret set PROD_AWS_SECRET_ACCESS_KEY --repo %REPO%
  echo ✅ PROD_AWS_SECRET_ACCESS_KEY set
)

set /p PROD_AWS_REGION="Enter PROD_AWS_REGION (default: ap-south-1): "
if "!PROD_AWS_REGION!"=="" set PROD_AWS_REGION=ap-south-1
echo !PROD_AWS_REGION! | gh secret set PROD_AWS_REGION --repo %REPO%
echo ✅ PROD_AWS_REGION set

set /p PROD_AWS_S3_CUSTOMER="Enter PROD_AWS_S3_CUSTOMER: "
if not "!PROD_AWS_S3_CUSTOMER!"=="" (
  echo !PROD_AWS_S3_CUSTOMER! | gh secret set PROD_AWS_S3_CUSTOMER --repo %REPO%
  echo ✅ PROD_AWS_S3_CUSTOMER set
)

set /p PROD_AWS_S3_ADMIN="Enter PROD_AWS_S3_ADMIN: "
if not "!PROD_AWS_S3_ADMIN!"=="" (
  echo !PROD_AWS_S3_ADMIN! | gh secret set PROD_AWS_S3_ADMIN --repo %REPO%
  echo ✅ PROD_AWS_S3_ADMIN set
)

set /p PROD_AWS_LAMBDA_FUNCTION="Enter PROD_AWS_LAMBDA_FUNCTION: "
if not "!PROD_AWS_LAMBDA_FUNCTION!"=="" (
  echo !PROD_AWS_LAMBDA_FUNCTION! | gh secret set PROD_AWS_LAMBDA_FUNCTION --repo %REPO%
  echo ✅ PROD_AWS_LAMBDA_FUNCTION set
)

set /p PROD_AWS_CLOUDFRONT_DIST="Enter PROD_AWS_CLOUDFRONT_DIST: "
if not "!PROD_AWS_CLOUDFRONT_DIST!"=="" (
  echo !PROD_AWS_CLOUDFRONT_DIST! | gh secret set PROD_AWS_CLOUDFRONT_DIST --repo %REPO%
  echo ✅ PROD_AWS_CLOUDFRONT_DIST set
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo OPTIONAL SECRETS
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

set /p SLACK_WEBHOOK="Enter SLACK_WEBHOOK (optional, press Enter to skip): "
if not "!SLACK_WEBHOOK!"=="" (
  echo !SLACK_WEBHOOK! | gh secret set SLACK_WEBHOOK --repo %REPO%
  echo ✅ SLACK_WEBHOOK set
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo ✅ All secrets have been set!
echo ═══════════════════════════════════════════════════════════════
echo.
echo Verify secrets were set correctly:
echo   gh secret list --repo %REPO%
echo.
echo View workflow in Actions tab:
echo   https://github.com/%REPO%/actions
echo.

endlocal
