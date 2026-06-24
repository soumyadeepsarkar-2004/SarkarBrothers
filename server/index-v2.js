// ═══════════════════════════════════════════════════════════════
// PRODUCTION-READY DUAL-PORTAL BACKEND (v2)
// Multi-tenant architecture with role-based access control
// ═══════════════════════════════════════════════════════════════

import 'dotenv/config';
import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

// ─── Middleware & Types ─────────────────────────────────────
import {
    authenticate,
    requirePortal,
    requireRole,
    requireAdmin,
    requireCustomer,
    generateToken,
    auditLog
} from '../shared/middleware/auth.js';
import {
    User,
    Product,
    Order,
    AuditLog as AuditLogModel
} from './models.js';
import { products as seedProducts, mockUsers } from './data.js';

// ─── Configuration ──────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

// Enforce production security
if (IS_PROD && !JWT_SECRET) {
    console.error('FATAL: JWT_SECRET required in production');
    process.exit(1);
}

if (IS_PROD && !MONGO_URI) {
    console.error('FATAL: MONGODB_URI required in production');
    process.exit(1);
}

if (IS_PROD && !STRIPE_KEY) {
    console.error('FATAL: STRIPE_SECRET_KEY required in production');
    process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY || 'sk_test_dummy');
const SECRET = JWT_SECRET || 'dev-secret';
let ai = null;
if (GEMINI_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    console.log('✓ Gemini AI initialized');
}

let dbConnected = false;

// ─── Middleware Stack ───────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: IS_PROD ? {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'img-src': ["'self'", 'data:', 'https:', 'http:'],
            'connect-src': ["'self'", 'https://generativelanguage.googleapis.com', 'https://api.stripe.com'],
        }
    } : false
}));

app.use(compression());
app.use(cookieParser());
app.use(cors({
    origin: IS_PROD ? [
        process.env.CUSTOMER_PORTAL_URL || 'https://customer.sarkarbrothers.com',
        process.env.ADMIN_PORTAL_URL || 'https://admin.sarkarbrothers.com'
    ] : true,
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Rate Limiting ──────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { error: 'Too many requests' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts' }
});

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    message: { error: 'AI rate limit exceeded' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// ─── Request Logger ────────────────────────────────────────
if (!IS_PROD) {
    app.use((req, res, next) => {
        const ts = new Date().toISOString();
        console.log(`${ts} | ${req.method} ${req.path}`);
        next();
    });
}

// ─── Database Connection ───────────────────────────────────
const connectDB = async () => {
    if (!MONGO_URI) {
        console.log('⚠️  No MONGODB_URI. Running with mock data.');
        return;
    }
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        dbConnected = true;
        console.log('✓ MongoDB connected');
    } catch (err) {
        console.error('✗ MongoDB error:', err.message);
        if (IS_PROD) process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => { dbConnected = false; });
mongoose.connection.on('reconnected', () => { dbConnected = true; });

await connectDB();

// ─── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        mongodb: dbConnected ? 'connected' : 'disconnected',
        stripe: STRIPE_KEY ? 'configured' : 'missing',
        ai: ai ? 'enabled' : 'disabled',
        uptime: process.uptime(),
    });
});

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION ROUTES (Portal-Agnostic)
// ═══════════════════════════════════════════════════════════════

// Unified Login (detects portal from request header or body)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, portal } = req.body;
        if (!email || !password || !portal) {
            return res.status(400).json({ error: 'Email, password, and portal required' });
        }

        // Demo accounts (dev only)
        if (!IS_PROD) {
            if (email === 'user@example.com' && password === 'password') {
                const user = { id: 'customer-1', email, name: 'Sarah Jenkins', role: 'customer', portalAccess: ['customer'] };
                const token = generateToken(user.id, email, 'customer', ['customer'], SECRET);
                return res.json({ user, token });
            }
            if (email === 'admin@example.com' && password === 'adminpass') {
                const user = { id: 'admin-1', email, name: 'Admin Owner', role: 'admin', portalAccess: ['admin', 'customer'] };
                const token = generateToken(user.id, email, 'admin', ['admin', 'customer'], SECRET);
                return res.json({ user, token });
            }
        }

        // DB Lookup
        if (dbConnected) {
            const user = await User.findOne({ email }).select('+passwordHash');
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            const match = await bcrypt.compare(password, user.passwordHash);
            if (!match) return res.status(401).json({ error: 'Invalid credentials' });

            // Check portal access
            if (!user.portalAccess.includes(portal)) {
                return res.status(403).json({ error: `No access to ${portal} portal` });
            }

            const token = generateToken(user._id.toString(), email, user.role, user.portalAccess, SECRET);
            const userData = user.toObject();
            delete userData.passwordHash;

            return res.json({ user: userData, token });
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });

        return res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register (Customer Portal Only)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, password required' });
        }

        if (dbConnected) {
            const existing = await User.findOne({ email });
            if (existing) return res.status(409).json({ error: 'Email already registered' });

            const passwordHash = await bcrypt.hash(password, 12);
            const user = await User.create({
                name,
                email,
                passwordHash,
                phone: phone || '',
                role: 'customer',
                portalAccess: ['customer'],
                avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`
            });

            const token = generateToken(user._id.toString(), email, 'customer', ['customer'], SECRET);
            const userData = user.toObject();
            delete userData.passwordHash;

            return res.status(201).json({ user: userData, token });
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });

        return res.status(500).json({ error: 'Registration failed' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ═══════════════════════════════════════════════════════════════
// CUSTOMER PORTAL ROUTES
// ═══════════════════════════════════════════════════════════════

// Get Products (Paginated)
app.get('/api/customer/products', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, sort } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        if (dbConnected) {
            let query = { stock: { $gt: 0 }, isPublished: true };
            if (category) query.category = category;
            if (search) query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];

            let dbQuery = Product.find(query);
            if (sort === 'price-asc') dbQuery = dbQuery.sort({ price: 1 });
            else if (sort === 'price-desc') dbQuery = dbQuery.sort({ price: -1 });
            else if (sort === 'rating') dbQuery = dbQuery.sort({ rating: -1 });
            else dbQuery = dbQuery.sort({ createdAt: -1 });

            const total = await Product.countDocuments(query);
            const products = await dbQuery.skip(skip).limit(parseInt(limit)).lean();

            return res.json({
                products,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
            });
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.json({ products: seedProducts, pagination: { page: 1, limit: 20, total: seedProducts.length, pages: 1 } });
    } catch (err) {
        console.error('Products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get Single Product
app.get('/api/customer/products/:id', async (req, res) => {
    try {
        if (dbConnected) {
            const product = await Product.findById(req.params.id).lean();
            if (!product) return res.status(404).json({ error: 'Product not found' });
            return res.json(product);
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        const product = seedProducts.find(p => p.id === req.params.id);
        res.json(product || { error: 'Product not found' });
    } catch (err) {
        console.error('Product error:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create Order + Stripe Payment Intent
app.post('/api/customer/orders', authenticate, requirePortal(['customer']), async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;
        if (!items || !shippingAddress) {
            return res.status(400).json({ error: 'Items and shipping address required' });
        }

        // Calculate order total
        let orderTotal = 0;
        const orderItems = [];

        for (const item of items) {
            if (dbConnected) {
                const product = await Product.findById(item.productId).lean();
                if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` });
                if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });

                orderItems.push({
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    image: product.image
                });
                orderTotal += product.price * item.quantity;
            }
        }

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(orderTotal * 100), // cents
            currency: 'inr',
            metadata: { customerId: req.user.id, email: req.user.email }
        });

        if (dbConnected) {
            const order = await Order.create({
                customerId: req.user.id,
                customerEmail: req.user.email,
                customerName: req.user.name,
                items: orderItems,
                total: orderTotal,
                status: 'pending',
                paymentStatus: 'pending',
                shippingAddress,
                stripePaymentIntentId: paymentIntent.id
            });

            return res.status(201).json({
                order: order.toObject(),
                paymentIntent: { clientSecret: paymentIntent.client_secret }
            });
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.status(500).json({ error: 'Order creation failed' });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get Customer Orders
app.get('/api/customer/orders', authenticate, requirePortal(['customer']), async (req, res) => {
    try {
        if (dbConnected) {
            const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 }).lean();
            return res.json(orders);
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.json([]);
    } catch (err) {
        console.error('Orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN PORTAL ROUTES
// ═══════════════════════════════════════════════════════════════

// Product Management - Create
app.post('/api/admin/products', authenticate, requireAdmin, auditLog('product_create'), async (req, res) => {
    try {
        const { name, price, category, description, stock, image, originalPrice } = req.body;
        if (!name || !price || !category || !stock) {
            return res.status(400).json({ error: 'Name, price, category, stock required' });
        }

        if (dbConnected) {
            const product = await Product.create({
                name,
                price,
                originalPrice,
                category,
                description,
                stock,
                image,
                rating: 0,
                reviews: 0,
                createdBy: req.user.id
            });

            return res.status(201).json(product.toObject());
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.status(500).json({ error: 'Product creation failed' });
    } catch (err) {
        console.error('Product creation error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Product Management - List all for Admin
app.get('/api/admin/products', authenticate, requireAdmin, async (req, res) => {
    try {
        if (dbConnected) {
            const products = await Product.find({}).sort({ createdAt: -1 }).lean();
            return res.json(products);
        }
        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.json([]);
    } catch (err) {
        console.error('Admin products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
app.post('/api/admin/products/upload', authenticate, requireAdmin, upload.single('image'), auditLog('product_upload'), async (req, res) => {
    try {
        const { name, price, category, description, stock, originalPrice } = req.body;
        if (!name || !price || !category || !stock) {
            return res.status(400).json({ error: 'Name, price, category, stock required' });
        }

        if (dbConnected) {
            let imageUrl = '';
            if (req.file) {
                const b64 = Buffer.from(req.file.buffer).toString('base64');
                const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
                const result = await cloudinary.uploader.upload(dataURI, { resource_type: 'auto' });
                imageUrl = result.secure_url;
            }

            const product = await Product.create({
                name,
                price,
                originalPrice,
                category,
                description,
                stock,
                imageUrl, // Save Cloudinary URL
                isPublished: false, // Explicitly set as unpublished draft
                rating: 0,
                reviews: 0,
                createdBy: req.user.id
            });

            return res.status(201).json(product.toObject());
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.status(500).json({ error: 'Product upload failed' });
    } catch (err) {
        console.error('Product upload error:', err);
        res.status(500).json({ error: 'Failed to upload product' });
    }
});

// Product Management - Publish
app.patch('/api/admin/products/:id/publish', authenticate, requireAdmin, auditLog('product_publish'), async (req, res) => {
    try {
        if (dbConnected) {
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                { isPublished: true },
                { new: true }
            );

            if (!product) return res.status(404).json({ error: 'Product not found' });
            return res.json(product.toObject());
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.status(500).json({ error: 'Publish failed' });
    } catch (err) {
        console.error('Publish error:', err);
        res.status(500).json({ error: 'Failed to publish product' });
    }
});

// Bulk Product Upload
app.post('/api/admin/products/bulk', authenticate, requireAdmin, auditLog('bulk_upload'), async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Products array required' });
        }

        if (dbConnected) {
            const productsWithMeta = products.map(p => ({
                ...p,
                rating: 0,
                reviews: 0,
                createdBy: req.user.id
            }));

            const created = await Product.insertMany(productsWithMeta);
            return res.json({ created: created.length, products: created });
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.status(500).json({ error: 'Bulk upload failed' });
    } catch (err) {
        console.error('Bulk upload error:', err);
        res.status(500).json({ error: 'Failed to upload products' });
    }
});

// Update Product Stock
app.patch('/api/admin/products/:id/stock', authenticate, requireAdmin, auditLog('inventory_update'), async (req, res) => {
    try {
        const { newStock, reason } = req.body;
        if (newStock === undefined) {
            return res.status(400).json({ error: 'newStock required' });
        }

        if (dbConnected) {
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                { stock: newStock },
                { new: true }
            );

            if (!product) return res.status(404).json({ error: 'Product not found' });
            return res.json(product.toObject());
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.status(500).json({ error: 'Update failed' });
    } catch (err) {
        console.error('Stock update error:', err);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// Get Orders (Admin View)
app.get('/api/admin/orders', authenticate, requireAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        if (dbConnected) {
            let query = {};
            if (status) query.status = status;

            const total = await Order.countDocuments(query);
            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            return res.json({
                orders,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
            });
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.json({ orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    } catch (err) {
        console.error('Admin orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update Order Status
app.patch('/api/admin/orders/:id/status', authenticate, requireAdmin, auditLog('order_status_update'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        if (dbConnected) {
            const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
            if (!order) return res.status(404).json({ error: 'Order not found' });
            return res.json(order.toObject());
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.status(500).json({ error: 'Status update failed' });
    } catch (err) {
        console.error('Status update error:', err);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Admin Analytics Dashboard
app.get('/api/admin/analytics', authenticate, requireAdmin, async (req, res) => {
    try {
        if (dbConnected) {
            const totalOrders = await Order.countDocuments();
            const totalRevenue = await Order.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);

            const totalCustomers = await User.countDocuments({ role: 'customer' });
            const topProducts = await Order.aggregate([
                { $unwind: '$items' },
                { $group: { _id: '$items.productId', sales: { $sum: '$items.quantity' } } },
                { $sort: { sales: -1 } },
                { $limit: 10 }
            ]);

            return res.json({
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                totalCustomers,
                topProducts
            });
        }

        if (IS_PROD) return res.status(503).json({ error: 'Database unavailable' });
        return res.json({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0, topProducts: [] });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// ═══════════════════════════════════════════════════════════════
// WEBHOOK HANDLERS
// ═══════════════════════════════════════════════════════════════

// Stripe Webhook
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        // Verify webhook signature
        let event;
        if (process.env.STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } else {
            event = JSON.parse(req.body.toString());
        }

        switch (event.type) {
            case 'payment_intent.succeeded':
                if (dbConnected) {
                    const paymentIntent = event.data.object;
                    await Order.findOneAndUpdate(
                        { stripePaymentIntentId: paymentIntent.id },
                        { paymentStatus: 'completed', status: 'processing' }
                    );
                }
                break;

            case 'payment_intent.payment_failed':
                if (dbConnected) {
                    const paymentIntent = event.data.object;
                    await Order.findOneAndUpdate(
                        { stripePaymentIntentId: paymentIntent.id },
                        { paymentStatus: 'failed' }
                    );
                }
                break;
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(400).json({ error: 'Webhook failed' });
    }
});

// ─── 404 & Error Handler ───────────────────────────────────
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        error: IS_PROD ? 'Internal server error' : err.message
    });
};
app.use(errorHandler);

// ─── Graceful Shutdown ─────────────────────────────────────
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down...`);
    if (dbConnected) await mongoose.connection.close();
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  SarkarBrothers Dual-Portal API SERVER  ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`  Port: ${PORT}`);
    console.log(`  Environment: ${NODE_ENV}`);
    console.log(`  MongoDB: ${dbConnected ? '✓ Connected' : '✗ Disconnected'}`);
    console.log(`  Stripe: ${STRIPE_KEY ? '✓ Configured' : '⚠️  Missing'}`);
    console.log(`  Gemini AI: ${ai ? '✓ Enabled' : '⚠️  Disabled'}`);
    console.log(`  Health: http://localhost:${PORT}/api/health`);
    console.log('');
});

export default app;
