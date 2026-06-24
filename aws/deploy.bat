@echo off
REM ═══════════════════════════════════════════════════════════════
REM AWS LAMBDA DEPLOYMENT SCRIPT (Windows)
REM ═══════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

REM Configuration
set STAGE=%1
if "%STAGE%"=="" set STAGE=dev

set SERVICE_NAME=sarkarbrothers-api
set AWS_REGION=ap-south-1
set PROFILE=%2
if "%PROFILE%"=="" set PROFILE=default

echo ═══════════════════════════════════════════════════════════════
echo SARKARBROTHERS - AWS LAMBDA DEPLOYMENT
echo ═══════════════════════════════════════════════════════════════
echo Stage: %STAGE%
echo Region: %AWS_REGION%
echo Profile: %PROFILE%
echo.

REM Check if serverless is installed
where serverless >nul 2>&1
if errorlevel 1 (
  echo ✗ Serverless Framework not found
  echo Install with: npm install -g serverless
  exit /b 1
)

REM Check AWS credentials
aws sts get-caller-identity --profile %PROFILE% >nul 2>&1
if errorlevel 1 (
  echo ✗ AWS credentials not configured for profile: %PROFILE%
  echo Configure with: aws configure --profile %PROFILE%
  exit /b 1
)

REM Build frontend assets
echo [1/4] Building frontend assets...
call npm run build >nul 2>&1
if errorlevel 1 (
  echo ✗ Frontend build failed
  exit /b 1
)
echo ✓ Frontend built successfully

REM Install serverless plugins
echo [2/4] Installing serverless plugins...
call npm install --save-dev serverless-plugin-tracing serverless-offline serverless-http >nul 2>&1
echo ✓ Plugins installed

REM Verify production secrets if needed
if "%STAGE%"=="prod" (
  echo [3/4] Verifying production secrets...
  for %%S in (
    "mongodb-uri"
    "jwt-secret"
    "stripe-secret"
    "stripe-webhook"
    "gemini-key"
  ) do (
    aws secretsmanager describe-secret --secret-id "/%SERVICE_NAME%/%STAGE%/%%S" --region %AWS_REGION% --profile %PROFILE% >nul 2>&1
    if errorlevel 1 (
      echo ✗ /%SERVICE_NAME%/%STAGE%/%%S not found in AWS Secrets Manager
      exit /b 1
    )
  )
)

REM Deploy to AWS Lambda
echo [4/4] Deploying to AWS Lambda...
call serverless deploy ^
  --stage %STAGE% ^
  --region %AWS_REGION% ^
  --verbose ^
  --aws-profile %PROFILE%

if errorlevel 1 (
  echo ✗ Deployment failed
  exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════════
echo ✓ DEPLOYMENT SUCCESSFUL!
echo ════════════════════════════════════════════════════════════════
echo.
echo Deployment Information:
call serverless info --stage %STAGE% --region %AWS_REGION% --aws-profile %PROFILE%

echo.
echo Next Steps:
echo 1. Update frontend .env with your API Gateway URL
echo 2. Configure custom domain ^(optional^): serverless create-domain --stage %STAGE%
echo 3. Monitor logs: serverless logs -f api --stage %STAGE% --tail

endlocal
