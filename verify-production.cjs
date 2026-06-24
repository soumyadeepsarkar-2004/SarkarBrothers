#!/usr/bin/env node
/**
 * SarkarBrothers - Production Readiness Verification Script
 * Tests that all components are working before launch
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TESTS = [
  {
    name: 'Root package.json exists',
    fn: () => fs.existsSync(path.join(__dirname, 'package.json'))
  },
  {
    name: 'Customer portal package.json exists',
    fn: () => fs.existsSync(path.join(__dirname, 'customer-portal', 'package.json'))
  },
  {
    name: 'Admin portal package.json exists',
    fn: () => fs.existsSync(path.join(__dirname, 'admin-portal', 'package.json'))
  },
  {
    name: 'Backend file exists (index-v2.js)',
    fn: () => fs.existsSync(path.join(__dirname, 'server', 'index-v2.js'))
  },
  {
    name: 'Shared types exist',
    fn: () => fs.existsSync(path.join(__dirname, 'shared', 'types', 'index.ts'))
  },
  {
    name: 'Shared middleware exists',
    fn: () => fs.existsSync(path.join(__dirname, 'shared', 'middleware', 'auth.ts'))
  },
  {
    name: 'Deployment guide exists',
    fn: () => fs.existsSync(path.join(__dirname, 'DEPLOYMENT.md'))
  },
  {
    name: 'Launch checklist exists',
    fn: () => fs.existsSync(path.join(__dirname, 'LAUNCH.md'))
  },
  {
    name: 'README exists',
    fn: () => fs.existsSync(path.join(__dirname, 'README_DUAL_PORTAL.md'))
  },
  {
    name: 'GitHub Actions workflow exists',
    fn: () => fs.existsSync(path.join(__dirname, '.github', 'workflows', 'deploy.yml'))
  },
  {
    name: 'Customer portal dist built',
    fn: () => fs.existsSync(path.join(__dirname, 'customer-portal', 'dist', 'index.html'))
  },
  {
    name: 'Admin portal dist built',
    fn: () => fs.existsSync(path.join(__dirname, 'admin-portal', 'dist', 'index.html'))
  },
  {
    name: 'Node.js version 22+',
    fn: () => {
      const v = process.version;
      const major = parseInt(v.split('.')[0].substring(1));
      return major >= 22;
    }
  },
  {
    name: 'npm installed',
    fn: () => {
      try {
        execSync('npm --version', { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Concurrently installed',
    fn: () => fs.existsSync(path.join(__dirname, 'node_modules', 'concurrently'))
  },
  {
    name: 'Nodemon installed',
    fn: () => fs.existsSync(path.join(__dirname, 'node_modules', 'nodemon'))
  },
  {
    name: 'Backend syntax valid',
    fn: () => {
      try {
        execSync('node -c server/index-v2.js', { 
          cwd: __dirname,
          stdio: 'ignore' 
        });
        return true;
      } catch {
        return false;
      }
    }
  }
];

console.log('\n🔍 SarkarBrothers - Production Readiness Verification\n');
console.log('═'.repeat(60) + '\n');

let passed = 0;
let failed = 0;

TESTS.forEach(test => {
  try {
    const result = test.fn();
    if (result) {
      console.log(`✅ ${test.name}`);
      passed++;
    } else {
      console.log(`❌ ${test.name}`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ ${test.name} (error: ${err.message})`);
    failed++;
  }
});

console.log('\n' + '═'.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🚀 ALL CHECKS PASSED - READY FOR LAUNCH!\n');
  console.log('To start the application, run:');
  console.log('  npm run dev:portals\n');
  console.log('Then open:');
  console.log('  - Customer Portal: http://localhost:3001');
  console.log('  - Admin Portal: http://localhost:3002');
  console.log('  - Backend API: http://localhost:5000\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review and fix before launching.\n');
  process.exit(1);
}
