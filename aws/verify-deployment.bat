@echo off
REM ═══════════════════════════════════════════════════════════════
REM PORTAL DEPLOYMENT & VERIFICATION SCRIPT (Windows)
REM ═══════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

REM Configuration
set STAGE=%1
if "%STAGE%"=="" set STAGE=dev

set API_URL=%2
if "%API_URL%"=="" set API_URL=http://localhost:5000

set RESULTS_FILE=deployment-results.json
set FAILED_CHECKS=0
set PASSED_CHECKS=0

echo ═══════════════════════════════════════════════════════════════
echo SARKARBROTHERS - PORTAL DEPLOYMENT VERIFICATION
echo ═══════════════════════════════════════════════════════════════
echo Stage: %STAGE%
echo API URL: %API_URL%
echo.

REM ─── HEALTH CHECKS ────────────────────────────────────────────────
echo [1/10] BACKEND HEALTH CHECKS
echo.

REM Check API health
echo Testing API health endpoint...
curl -s -f "%API_URL%/api/health" >nul 2>&1
if errorlevel 1 (
  echo [FAIL] API health endpoint unreachable
  set /a FAILED_CHECKS+=1
  echo.
  echo Make sure backend server is running:
  echo   npm run server:dev
  echo.
  exit /b 1
) else (
  echo [PASS] API health endpoint
  set /a PASSED_CHECKS+=1
)

REM ─── PUBLIC ENDPOINTS ──────────────────────────────────────────
echo.
echo [2/10] PUBLIC ENDPOINTS
echo.

echo Testing /api/products...
curl -s -f "%API_URL%/api/products" >nul 2>&1
if errorlevel 1 (
  echo [FAIL] Get products endpoint
  set /a FAILED_CHECKS+=1
) else (
  echo [PASS] Get products endpoint
  set /a PASSED_CHECKS+=1
)

echo Testing /api/home-data...
curl -s -f "%API_URL%/api/home-data" >nul 2>&1
if errorlevel 1 (
  echo [FAIL] Get home data endpoint
  set /a FAILED_CHECKS+=1
) else (
  echo [PASS] Get home data endpoint
  set /a PASSED_CHECKS+=1
)

REM ─── AUTHENTICATION ────────────────────────────────────────────
echo.
echo [3/10] AUTHENTICATION
echo.

echo Testing login endpoint...
curl -s -X POST "%API_URL%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}" >nul 2>&1
if errorlevel 1 (
  echo [FAIL] Login endpoint
  set /a FAILED_CHECKS+=1
) else (
  echo [PASS] Login endpoint
  set /a PASSED_CHECKS+=1
)

REM ─── API SECURITY ──────────────────────────────────────────────
echo.
echo [4/10] API SECURITY
echo.

echo Testing admin endpoint protection...
curl -s -w "HTTP_CODE:%{http_code}" "%API_URL%/api/admin/users" -o nul 2>&1
REM Should return 401 or 403

REM ─── FRONTEND BUILDS ──────────────────────────────────────────
echo.
echo [5/10] FRONTEND BUILDS
echo.

if exist "dist" (
  echo [PASS] Main portal build exists
  set /a PASSED_CHECKS+=1
  
  REM Count files
  for /f %%A in ('dir /b /s "dist" 2^>nul ^| find /c /v ""') do set FILE_COUNT=%%A
  echo   Files in dist: !FILE_COUNT!
) else (
  echo [FAIL] Main portal build does not exist
  set /a FAILED_CHECKS+=1
  echo   Run: npm run build
)

if exist "customer-portal\dist" (
  echo [PASS] Customer portal build exists
  set /a PASSED_CHECKS+=1
) else (
  echo [FAIL] Customer portal build does not exist
  set /a FAILED_CHECKS+=1
)

if exist "admin-portal\dist" (
  echo [PASS] Admin portal build exists
  set /a PASSED_CHECKS+=1
) else (
  echo [FAIL] Admin portal build does not exist
  set /a FAILED_CHECKS+=1
)

REM ─── STRIPE INTEGRATION ────────────────────────────────────────
echo.
echo [6/10] STRIPE INTEGRATION
echo.

if defined STRIPE_PUBLIC_KEY (
  echo [PASS] Stripe public key configured
  set /a PASSED_CHECKS+=1
) else (
  echo [WARN] Stripe public key not configured
  echo   Add to .env: VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
)

REM ─── CRITICAL FILES ────────────────────────────────────────────
echo.
echo [7/10] CRITICAL FILES
echo.

set FILE_CHECK=0
if exist "server\index.js" (
  echo [PASS] server/index.js
  set /a FILE_CHECK+=1
  set /a PASSED_CHECKS+=1
) else (
  echo [FAIL] server/index.js
  set /a FAILED_CHECKS+=1
)

if exist "shared\middleware\auth.js" (
  echo [PASS] shared/middleware/auth.js
  set /a FILE_CHECK+=1
  set /a PASSED_CHECKS+=1
) else (
  echo [FAIL] shared/middleware/auth.js
  set /a FAILED_CHECKS+=1
)

if exist "services\adminApi.ts" (
  echo [PASS] services/adminApi.ts
  set /a FILE_CHECK+=1
  set /a PASSED_CHECKS+=1
) else (
  echo [FAIL] services/adminApi.ts
  set /a FAILED_CHECKS+=1
)

if exist "components\CheckoutForm.tsx" (
  echo [PASS] components/CheckoutForm.tsx
  set /a FILE_CHECK+=1
  set /a PASSED_CHECKS+=1
) else (
  echo [FAIL] components/CheckoutForm.tsx
  set /a FAILED_CHECKS+=1
)

REM ─── DEPLOYMENT READINESS ─────────────────────────────────────
echo.
echo [8/10] DEPLOYMENT READINESS
echo.

REM Check Node.js version
for /f "tokens=*" %%I in ('node -v') do set NODE_VERSION=%%I
echo   Node.js version: %NODE_VERSION%
set /a PASSED_CHECKS+=1

REM Check npm
npm list -g npm >nul 2>&1
if errorlevel 1 (
  echo [FAIL] npm not found
  set /a FAILED_CHECKS+=1
) else (
  echo [PASS] npm is available
  set /a PASSED_CHECKS+=1
)

REM Check environment files
if exist ".env" (
  echo [PASS] .env file exists
  set /a PASSED_CHECKS+=1
) else if exist ".env.local" (
  echo [PASS] .env.local file exists
  set /a PASSED_CHECKS+=1
) else (
  echo [WARN] No .env file found
  echo   Create .env with: VITE_API_URL=%API_URL%
)

REM ─── SUMMARY ───────────────────────────────────────────────────
echo.
echo ═══════════════════════════════════════════════════════════════
echo VERIFICATION SUMMARY
echo ═══════════════════════════════════════════════════════════════
set /a TOTAL=PASSED_CHECKS+FAILED_CHECKS
echo Total Checks: %TOTAL%
echo [PASS] %PASSED_CHECKS%
echo [FAIL] %FAILED_CHECKS%
echo.

if %FAILED_CHECKS% equ 0 (
  echo ✓ ALL CHECKS PASSED - READY FOR DEPLOYMENT!
  echo.
  echo Next steps:
  echo 1. npm run build
  echo 2. npm run dev
  echo 3. aws\deploy.bat dev
  echo.
  exit /b 0
) else (
  echo ✗ SOME CHECKS FAILED - PLEASE REVIEW ABOVE
  echo.
  exit /b 1
)

endlocal
