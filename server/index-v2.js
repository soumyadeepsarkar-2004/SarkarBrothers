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

// Services
import { loginUser, registerUser } from './services/authService.js';
import {
    getCustomerProducts,
    getProductById,
    createProduct,
    listAdminProducts,
    uploadProductDraft,
    publishProduct,
    bulkUploadProducts,
    updateProductStock
} from './services/productService.js';
import {
    createCustomerOrder,
    getCustomerOrders,
    getAdminOrders,
    updateOrderStatus,
    getAdminAnalytics,
    handleStripeWebhook
} from './services/orderService.js';

// ─── Configuration ──────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

// Enforce production security warnings instead of crashes to support mock fallbacks
if (IS_PROD && !JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET missing in production, using default.');
}

if (IS_PROD && !MONGO_URI) {
    console.warn('WARNING: MONGODB_URI missing in production, running with mock database.');
}

if (IS_PROD && !STRIPE_KEY) {
    console.warn('WARNING: STRIPE_SECRET_KEY missing in production, running with mock Stripe payments.');
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
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
            process.env.CUSTOMER_PORTAL_URL || 'https://customer.sarkarbrothers.com',
            process.env.ADMIN_PORTAL_URL || 'https://admin.sarkarbrothers.com',
            'https://customer-portal-delta-ebon.vercel.app',
            'https://admin-portal-gold-eta.vercel.app'
        ];
        if (
            allowedOrigins.includes(origin) ||
            !IS_PROD ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin.endsWith('.vercel.app')
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
        console.log('⚠️ Running backend with database unavailable. Routes will return 503 or use mock fallback if configured.');
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
        const { email, password } = req.body;
        const portal = req.body.portal || 'customer';
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const result = await loginUser({
            email,
            password,
            portal,
            isProd: IS_PROD,
            dbConnected,
            secret: SECRET
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ═══════════════════════════════════════════════════════════════
// LEGACY STOREFRONT FRONTEND ROUTES (FOR COMPATIBILITY)
// ═══════════════════════════════════════════════════════════════

// Legacy list products (mapped to getCustomerProducts logic)
app.get('/api/products', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search, sort } = req.query;
        const result = await getCustomerProducts({
            page: Number(page),
            limit: Number(limit),
            category,
            search,
            sort,
            dbConnected,
            isProd: IS_PROD
        });
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        // Legacy storefront expects direct array or { products }
        return res.status(result.status).json(result.data.products || []);
    } catch (err) {
        console.error('Legacy products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Legacy get product details
app.get('/api/products/:id', async (req, res) => {
    try {
        const result = await getProductById({
            id: req.params.id,
            dbConnected,
            isProd: IS_PROD
        });
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Legacy product details error:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Legacy user profile (GET)
app.get('/api/user/profile', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email parameter required' });
        if (dbConnected) {
            const { User } = await import('./models.js');
            const user = await User.findOne({ email }).select('-passwordHash').lean();
            if (user) return res.json(user);
        }
        const { mockUsers } = await import('./data.js');
        if (mockUsers[email]) return res.json(mockUsers[email]);
        return res.status(404).json({ error: 'Profile not found' });
    } catch (err) {
        console.error('Legacy user profile error:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Legacy user profile (PUT)
app.put('/api/user/profile', async (req, res) => {
    try {
        const { email, ...updates } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });
        if (dbConnected) {
            const { User } = await import('./models.js');
            const user = await User.findOneAndUpdate({ email }, updates, { new: true }).select('-passwordHash').lean();
            if (user) return res.json(user);
        }
        const { mockUsers } = await import('./data.js');
        if (mockUsers[email]) {
            mockUsers[email] = { ...mockUsers[email], ...updates, email };
            return res.json(mockUsers[email]);
        }
        return res.status(404).json({ error: 'User not found' });
    } catch (err) {
        console.error('Legacy update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Legacy user orders (GET)
app.get('/api/user/orders', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email parameter required' });
        if (dbConnected) {
            try {
                const { Order } = await import('./models.js');
                const orders = await Order.find({ customerEmail: email }).sort({ createdAt: -1 }).lean();
                if (orders.length > 0) return res.json(orders);
            } catch (dbErr) { console.error('DB orders lookup failed:', dbErr.message); }
        }
        const { orders: mockOrders } = await import('./data.js');
        const userOrders = mockOrders
            .filter(order => order.customerEmail === email)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json(userOrders);
    } catch (err) {
        console.error('Legacy user orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Legacy user orders (POST)
app.post('/api/user/orders', async (req, res) => {
    try {
        const { items, total, email, shippingAddress, paymentMethod } = req.body;
        if (!items?.length || !total || !email) return res.status(400).json({ error: 'Items, total, and email are required' });
        if (dbConnected) {
            try {
                const { Order } = await import('./models.js');
                const order = await Order.create({
                    customerEmail: email,
                    items: items.map(item => ({ product: item.productId || item.id, quantity: item.quantity, priceAtPurchase: item.price })),
                    total,
                    status: 'Processing',
                    shippingAddress,
                    paymentMethod: paymentMethod || 'UPI / QR Scan',
                });
                return res.status(201).json(order);
            } catch (dbErr) { console.error('DB order creation failed:', dbErr.message); }
        }
        const { mockUsers, orders: mockOrders } = await import('./data.js');
        const userProfile = mockUsers[email];
        const newOrder = {
            id: 'ORD-' + (Math.floor(Math.random() * 9000) + 1000),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            customerName: userProfile?.name || 'Guest',
            customerEmail: email,
            items: items.map(item => ({ productId: item.productId || item.id, name: item.name, image: item.image, quantity: item.quantity, price: item.price })),
            total,
            status: 'Processing',
            shippingAddress: shippingAddress || (mockOrders[0] && mockOrders[0].shippingAddress),
            paymentMethod: paymentMethod || 'UPI / QR Scan',
        };
        mockOrders.unshift(newOrder);
        res.status(201).json(newOrder);
    } catch (err) {
        console.error('Legacy create order error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Legacy AI chat
app.post('/api/ai/chat', aiLimiter, async (req, res) => {
    try {
        const { message, language = 'en' } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        if (!ai) {
            const input = message.toLowerCase();
            let response = language === 'bn'
                ? 'আমাদের শিক্ষামূলক, আউটডোর ফান এবং প্লাশিজ বিভাগ দেখুন। 🎁'
                : 'Check out our Educational, Outdoor Fun, and Plushies categories! 🎁';
            if (input.includes('robot') || input.includes('tech')) response = 'Our Super Galactic Robot (₹3,999) has voice commands and LED lights! 🤖';
            else if (input.includes('gift') || input.includes('birthday')) response = 'Try our Surprise Gift Box (₹1,699) or Castle Builder Set (₹7,999)! 🎁';
            else if (input.includes('plush') || input.includes('bear')) response = 'The Cuddly Elephant (₹1,699) and Cuddly Brown Bear (₹2,199) are favorites! 🧸';
            return res.json({ text: response });
        }
        const systemPrompt = 'You are GiftBot for SarkarBrothers toy shop. Language: ' + (language === 'bn' ? 'Bengali' : 'English') + '.\n' +
            'Available: Speed Racer RC (₹3,499), Castle Builder Set (₹7,999), Cuddly Elephant (₹1,699), Mega Art Kit (₹2,999), Super Galactic Robot (₹3,999), Wooden Express Train (₹2,499), Cuddly Brown Bear (₹2,199), Rainbow Stacker (₹1,199), Surprise Gift Box (₹1,699).\n' +
            'Recommend specific products. Keep under 80 words. Be cheerful. Use emojis.';
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: systemPrompt + '\n\nCustomer: ' + message,
        });
        res.json({ text: result.text || 'I\'d love to help! What kind of toy are you looking for? 🎁' });
    } catch (err) {
        console.error('AI chat error:', err);
        const input = (req.body.message || '').toLowerCase();
        let fallback = 'I\'m having a little trouble right now. Try browsing our Educational, Plushies, or Outdoor Fun categories! 🎁';
        if (input.includes('robot')) fallback = 'Check out our Super Galactic Robot (₹3,999)! It\'s our best-seller. 🤖';
        else if (input.includes('gift')) fallback = 'Our Surprise Gift Box (₹1,699) is always a hit! 🎁';
        res.json({ text: fallback });
    }
});

// Legacy AI recommend
app.post('/api/ai/recommend', aiLimiter, async (req, res) => {
    try {
        const { history = [] } = req.body;
        const { products: seedProducts } = await import('./data.js');
        const getProductsFromSource = async (query = {}) => {
            if (dbConnected) {
                try {
                    const { Product } = await import('./models.js');
                    return await Product.find(query).lean();
                } catch (e) {}
            }
            let results = [...seedProducts];
            if (query.category) results = results.filter(p => p.category === query.category);
            return results;
        };
        if (history.length === 0) {
            const popular = await getProductsFromSource();
            return res.json(popular.sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 4));
        }
        if (!ai) {
            const keywords = history.join(' ').toLowerCase();
            const allProducts = await getProductsFromSource();
            const recs = allProducts.filter(p => keywords.includes((p.category || '').toLowerCase()) || keywords.includes((p.name || '').split(' ')[0].toLowerCase()));
            return res.json(recs.length > 0 ? recs.slice(0, 4) : allProducts.slice(0, 4));
        }
        const prompt = 'User has viewed: ' + history.join(', ') + '.\nIdentify the top 2 most relevant toy categories from: [Educational, Outdoor Fun, Plushies, Arts & Crafts, Robots, Gifts].\nReturn ONLY the category names separated by commas.';
        const result = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
        const categories = (result.text || '').split(',').map(s => s.trim()).filter(Boolean);
        let recommendations;
        if (dbConnected) {
            const { Product } = await import('./models.js');
            recommendations = await Product.find({ category: { $in: categories } }).limit(4).lean();
        } else {
            recommendations = seedProducts.filter(p => categories.includes(p.category)).slice(0, 4);
        }
        if (recommendations.length === 0) recommendations = (await getProductsFromSource()).slice(0, 4);
        res.json(recommendations);
    } catch (err) {
        console.error('Recommendation error:', err);
        const { products: seedProducts } = await import('./data.js');
        const fallback = seedProducts.slice(0, 4);
        res.json(fallback);
    }
});

// Legacy AI search-recommend
app.post('/api/ai/search-recommend', aiLimiter, async (req, res) => {
    try {
        const { searchQuery } = req.body;
        if (!searchQuery?.trim()) return res.json([]);
        const { products: seedProducts } = await import('./data.js');
        const getProductsFromSource = async (query = {}) => {
            if (dbConnected) {
                try {
                    const { Product } = await import('./models.js');
                    return await Product.find(query).lean();
                } catch (e) {}
            }
            let results = [...seedProducts];
            if (query.category) results = results.filter(p => p.category === query.category);
            return results;
        };
        if (!ai) {
            const allProducts = await getProductsFromSource();
            const q = searchQuery.toLowerCase();
            return res.json(allProducts.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 6));
        }
        const prompt = 'Customer searched: "' + searchQuery + '".\nIdentify top 3-4 categories from: [Educational, Outdoor Fun, Plushies, Arts & Crafts, Robots, Gifts].\nReturn ONLY category names separated by commas.';
        const result = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
        const categories = (result.text || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
        let recommendations;
        if (dbConnected) {
            const { Product } = await import('./models.js');
            recommendations = await Product.find({ category: { $in: categories } }).limit(6).lean();
        } else {
            recommendations = seedProducts.filter(p => categories.includes(p.category)).slice(0, 6);
        }
        if (recommendations.length === 0) {
            const allProducts = await getProductsFromSource();
            const q = searchQuery.toLowerCase();
            recommendations = allProducts.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 6);
        }
        res.json(recommendations);
    } catch (err) {
        console.error('Search recommendation error:', err);
        const { products: seedProducts } = await import('./data.js');
        const q = (req.body.searchQuery || '').toLowerCase();
        res.json(seedProducts.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 6));
    }
});

// Legacy AI voice
app.post('/api/ai/voice', aiLimiter, async (req, res) => {
    try {
        const { message, language = 'en' } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        if (!ai) {
            const input = message.toLowerCase();
            let response = 'I can help you find the perfect toy! What age group and interests are you shopping for?';
            if (input.includes('robot')) response = 'Our Super Galactic Robot (₹3,999) is amazing! Voice commands, LED lights, and 360° mobility. 🤖';
            else if (input.includes('gift')) response = 'Try our Surprise Gift Box (₹1,699) - always a hit! 🎁';
            else if (input.includes('plush') || input.includes('bear')) response = 'Our Cuddly Brown Bear (₹2,199) is super soft and loved by kids! 🧸';
            return res.json({ text: response });
        }
        const prompt = 'You are a voice assistant for SarkarBrothers toy shop.\nCustomer said: "' + message + '"\nAvailable: Speed Racer RC (₹3,499), Castle Builder Set (₹7,999), Cuddly Elephant (₹1,699), Mega Art Kit (₹2,999), Super Galactic Robot (₹3,999), Wooden Express Train (₹2,499), Cuddly Brown Bear (₹2,199), Rainbow Stacker (₹1,199), Surprise Gift Box (₹1,699).\nReply concisely (under 50 words). Be warm.' + (language === 'bn' ? ' Reply in Bengali.' : '');
        const result = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
        res.json({ text: result.text || "I'd love to help! What are you looking for? 🎁" });
    } catch (err) {
        console.error('Voice AI error:', err);
        res.json({ text: 'I am having trouble with my voice processor right now. 🎁' });
    }
});

// Legacy payments create-intent
app.post('/api/payments/create-intent', authenticate, async (req, res) => {
    try {
        const { amount, metadata } = req.body;
        if (!amount) return res.status(400).json({ error: 'Amount is required' });
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'inr',
            metadata: metadata || {}
        });
        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status
        });
    } catch (err) {
        console.error('Payment intent creation failed:', err);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Legacy payments confirm
app.post('/api/payments/confirm', authenticate, async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        if (!paymentIntentId) return res.status(400).json({ error: 'PaymentIntentId is required' });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        res.json({
            success: paymentIntent.status === 'succeeded',
            message: `Payment status: ${paymentIntent.status}`,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status
        });
    } catch (err) {
        console.error('Payment confirmation failed:', err);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

// Legacy get payment intent details
app.get('/api/payments/intent/:paymentIntentId', authenticate, async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);
        res.json(paymentIntent);
    } catch (err) {
        console.error('Failed to get payment details:', err);
        res.status(500).json({ error: 'Failed to get payment details' });
    }
});

// Legacy refund payment
app.post('/api/payments/refund', authenticate, requireAdmin, async (req, res) => {
    try {
        const { paymentIntentId, reason } = req.body;
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: reason || 'requested_by_customer'
        });
        res.json(refund);
    } catch (err) {
        console.error('Refund failed:', err);
        res.status(500).json({ error: 'Refund failed' });
    }
});

// Register (Customer Portal Only)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, password required' });
        }

        const result = await registerUser({
            name,
            email,
            password,
            phone,
            isProd: IS_PROD,
            dbConnected,
            secret: SECRET
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
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
        const result = await getCustomerProducts({
            page,
            limit,
            category,
            search,
            sort,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get Single Product
app.get('/api/customer/products/:id', async (req, res) => {
    try {
        const result = await getProductById({
            id: req.params.id,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
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

        const result = await createCustomerOrder({
            items,
            shippingAddress,
            user: req.user,
            dbConnected,
            isProd: IS_PROD,
            stripe
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Get Customer Orders (Optional Pagination)
app.get('/api/customer/orders', authenticate, requirePortal(['customer']), async (req, res) => {
    try {
        const { page, limit } = req.query;
        const result = await getCustomerOrders({
            userId: req.user.id,
            page,
            limit,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
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

        const result = await createProduct({
            name,
            price,
            originalPrice,
            category,
            description,
            stock,
            image,
            userId: req.user.id,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Product creation error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Product Management - List all for Admin (Optional Pagination)
app.get('/api/admin/products', authenticate, requireAdmin, async (req, res) => {
    try {
        const { page, limit } = req.query;
        const result = await listAdminProducts({
            page,
            limit,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Admin products error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Product Management - Upload Draft with image
app.post('/api/admin/products/upload', authenticate, requireAdmin, upload.single('image'), auditLog('product_upload'), async (req, res) => {
    try {
        const { name, price, category, description, stock, originalPrice } = req.body;
        if (!name || !price || !category || !stock) {
            return res.status(400).json({ error: 'Name, price, category, stock required' });
        }

        const result = await uploadProductDraft({
            name,
            price,
            originalPrice,
            category,
            description,
            stock,
            file: req.file,
            userId: req.user.id,
            dbConnected,
            isProd: IS_PROD,
            cloudinary
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Product upload error:', err);
        res.status(500).json({ error: 'Failed to upload product' });
    }
});

// Product Management - Publish
app.patch('/api/admin/products/:id/publish', authenticate, requireAdmin, auditLog('product_publish'), async (req, res) => {
    try {
        const result = await publishProduct({
            id: req.params.id,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
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

        const result = await bulkUploadProducts({
            products,
            userId: req.user.id,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Bulk upload error:', err);
        res.status(500).json({ error: 'Failed to upload products' });
    }
});

// Update Product Stock
app.patch('/api/admin/products/:id/stock', authenticate, requireAdmin, auditLog('inventory_update'), async (req, res) => {
    try {
        const { newStock } = req.body;
        if (newStock === undefined) {
            return res.status(400).json({ error: 'newStock required' });
        }

        const result = await updateProductStock({
            id: req.params.id,
            newStock,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Stock update error:', err);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// Get Orders (Admin View)
app.get('/api/admin/orders', authenticate, requireAdmin, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const result = await getAdminOrders({
            status,
            page,
            limit,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
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

        const result = await updateOrderStatus({
            id: req.params.id,
            status,
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error('Status update error:', err);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Admin Analytics Dashboard
app.get('/api/admin/analytics', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await getAdminAnalytics({
            dbConnected,
            isProd: IS_PROD
        });

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
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
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (IS_PROD && !webhookSecret) {
        console.error('FATAL: STRIPE_WEBHOOK_SECRET is missing in production');
        return res.status(400).json({ error: 'Webhook secret is not configured' });
    }

    try {
        const result = await handleStripeWebhook({
            body: req.body,
            signature: sig,
            stripe,
            webhookSecret,
            dbConnected
        });
        return res.json(result);
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(400).json({ error: 'Webhook failed' });
    }
});

// ─── 404 & Error Handler ───────────────────────────────────
app.use((req, res) => {
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
if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
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
}

export default app;
