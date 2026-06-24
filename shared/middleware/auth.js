// ═══════════════════════════════════════════════════════════════
// ROLE-BASED ACCESS CONTROL MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// ─── Auth Middleware ─────────────────────────────────────────
export const authenticate = (req, res, next) => {
    try {
        const token = (req.headers.authorization || '').replace('Bearer ', '') || req.cookies?.token;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

// ─── Portal Authorization Middleware ────────────────────────
export const requirePortal = (allowedPortals) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userPortals = req.user.portalAccess || [];
        const hasAccess = allowedPortals.some(p => userPortals.includes(p));

        if (!hasAccess) {
            return res.status(403).json({
                error: `Forbidden: Portal access required. Allowed: ${allowedPortals.join(', ')}`
            });
        }

        next();
    };
};

// ─── Role Authorization Middleware ──────────────────────────
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Forbidden: Requires one of roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

// ─── Admin-Only Middleware ──────────────────────────────────
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

// ─── Customer-Only Middleware ───────────────────────────────
export const requireCustomer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'customer') {
        return res.status(403).json({ error: 'Customer portal required' });
    }

    next();
};

// ─── Audit Logging Middleware ───────────────────────────────
export const auditLog = (action) => {
    return async (req, res, next) => {
        const originalJson = res.json;

        res.json = function (data) {
            if (req.user && res.statusCode < 400) {
                // Log successful admin actions
                if (req.user.role === 'admin' || req.user.role === 'owner') {
                    console.log(`AUDIT: ${action} | User: ${req.user.email} | Resource: ${req.body?.resource || req.params?.id}`);
                    // TODO: Insert into audit_logs collection
                }
            }
            return originalJson.call(this, data);
        };

        next();
    };
};

// ─── Token Generation ────────────────────────────────────────
export const generateToken = (
    userId,
    email,
    role,
    portalAccess,
    expiresIn = '7d'
) => {
    return jwt.sign(
        { id: userId, email, role, portalAccess },
        JWT_SECRET,
        { expiresIn }
    );
};

// ─── Token Verification ─────────────────────────────────────
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
};
