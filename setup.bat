@echo off
REM 🚀 SarkarBrothers - Automated Setup Script (Windows)
REM Install all dependencies and configure dual-portal environment

echo.
echo 🔧 SarkarBrothers Dual-Portal Setup
echo ====================================
echo.

REM Check Node.js
echo ✅ Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js not installed. Please install Node.js 22.x from https://nodejs.org
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo    Found: %NODE_VERSION%
echo.

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install root dependencies
    exit /b 1
)
echo    ✅ Done
echo.

REM Install customer portal dependencies
echo 📦 Installing customer portal dependencies...
cd customer-portal
call npm install
if errorlevel 1 (
    echo ❌ Failed to install customer portal dependencies
    cd ..
    exit /b 1
)
cd ..
echo    ✅ Done
echo.

REM Install admin portal dependencies
echo 📦 Installing admin portal dependencies...
cd admin-portal
call npm install
if errorlevel 1 (
    echo ❌ Failed to install admin portal dependencies
    cd ..
    exit /b 1
)
cd ..
echo    ✅ Done
echo.

REM Create .env file if it doesn't exist
echo 📝 Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo    ⚠️  Created .env from .env.example
    echo    📋 Please update .env with your credentials:
    echo       - MONGODB_URI
    echo       - JWT_SECRET ^(generate random 32-char string^)
    echo       - STRIPE_SECRET_KEY
    echo       - GEMINI_API_KEY
    echo.
) else (
    echo    ✅ .env already exists
)
echo.

REM Verify directory structure
echo ✅ Verifying directory structure...
setlocal enabledelayedexpansion
for %%d in (customer-portal\src admin-portal\src shared\types shared\middleware server) do (
    if exist %%d (
        echo    ✅ %%d
    ) else (
        echo    ❌ %%d ^(missing!^)
    )
)
echo.

REM Check key files
echo ✅ Checking key files...
for %%f in (
    server\index-v2.js
    shared\types\index.ts
    shared\middleware\auth.ts
    customer-portal\src\App.tsx
    admin-portal\src\App.tsx
    .github\workflows\deploy.yml
    DEPLOYMENT.md
) do (
    if exist %%f (
        echo    ✅ %%f
    ) else (
        echo    ❌ %%f ^(missing!^)
    )
)
echo.

echo 🚀 Setup Complete!
echo.
echo Next steps:
echo 1. Update .env file with your credentials
echo 2. Run: npm run dev:portals
echo 3. Open: http://localhost:3001 ^(customer^) or http://localhost:3002 ^(admin^)
echo.
echo For more info, see README_DUAL_PORTAL.md
echo.

pause
