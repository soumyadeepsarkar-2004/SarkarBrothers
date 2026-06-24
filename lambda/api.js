// ═══════════════════════════════════════════════════════════════
// AWS LAMBDA HANDLER - Express App Adapter
// ═══════════════════════════════════════════════════════════════

import serverless from 'serverless-http';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Import middleware and routes
import { errorHandler } from '../shared/middleware/errors.js';
import { authenticate, requireRole, auditLog } from '../shared/middleware/auth.js';

// Create Express app (separate from Node.js version)
const app = express();

// ─── Middleware ──────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            "img-src": ["'self'", "data:", "https:", "http:"],
            "connect-src": ["'self'", "https://*.amazonaws.com", "https://generativelanguage.googleapis.com", "https://stripe.com"],
        }
    }
}));
app.use(compression());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: process.env.STAGE || 'dev',
        timestamp: new Date().toISOString(),
        region: process.env.AWS_REGION || 'ap-south-1',
    });
});

// ─── API Routes (Status Stub) ────────────────────────────────────
// In production, import actual routes from server/index.js
app.get('/api/status', (req, res) => {
    res.json({
        status: 'Lambda deployment active',
        stage: process.env.STAGE,
        service: 'SarkarBrothers API'
    });
});

// ─── Admin Routes Example ────────────────────────────────────────
app.get('/api/admin/health', authenticate, requireRole(['admin', 'owner']), (req, res) => {
    res.json({
        status: 'Admin panel active',
        user: req.user.email,
        role: req.user.role
    });
});

// ─── Error Handler ───────────────────────────────────────────────
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

app.use(errorHandler);

// ─── Lambda Handler ──────────────────────────────────────────────
export const handler = serverless(app);

// Cold start optimization
let initialized = false;

export const warmup = async (event) => {
    console.log('Lambda warmup triggered');
    return { statusCode: 200, body: JSON.stringify({ message: 'Lambda warmed up' }) };
};

// Initialization on first call
if (!initialized) {
    initialized = true;
    console.log('[Lambda] Initializing SarkarBrothers API');
    console.log(`[Lambda] Environment: ${process.env.STAGE}`);
    console.log(`[Lambda] Region: ${process.env.AWS_REGION}`);
}
