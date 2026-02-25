
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from "@google/genai";
import { User, Product, Order } from './models.js';
import { products as seedProducts, mockUsers, orders as mockOrders, salesData } from './data.js';

// ─── Configuration ─────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'toywonder-secret-key-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';

let dbConnected = false;

// ─── Middleware ─────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(compression());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' }, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'AI rate limit exceeded' } });

// Request logger (dev only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const ts = new Date().toISOString();
    console.log(ts + ' ' + req.method + ' ' + req.path);
    next();
  });
}

// ─── Database Connection ───────────────────────────────────────
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.log('No MONGODB_URI found. Running with mock data.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    dbConnected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Continuing with mock data fallback...');
  }
};

mongoose.connection.on('disconnected', () => { dbConnected = false; });
mongoose.connection.on('reconnected', () => { dbConnected = true; });

await connectDB();

// ─── Auth Middleware ────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '') || req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    if (token.startsWith('mock-jwt-')) {
      const parts = token.split('-');
      req.user = { id: parts[2], email: parts[2] === 'user-1' ? 'sarah.jenkins@example.com' : 'admin@example.com' };
      return next();
    }
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ─── Helper: Get products (DB or mock fallback) ────────────────
const getProductsFromSource = async (query = {}) => {
  if (dbConnected) {
    try { return await Product.find(query).lean(); } catch (e) { /* fall through */ }
  }
  let results = [...seedProducts];
  if (query.category) results = results.filter(p => p.category === query.category);
  return results;
};

const getProductByIdFromSource = async (id) => {
  if (dbConnected) {
    try { return await Product.findById(id).lean(); } catch (e) { /* fall through */ }
  }
  return seedProducts.find(p => p.id === id) || null;
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: dbConnected ? 'connected' : 'mock data mode',
    ai: ai ? 'available' : 'unavailable',
    uptime: process.uptime(),
  });
});

// ─── Gemini AI Setup ───────────────────────────────────────────
let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('Gemini AI initialized');
  } catch (err) {
    console.error('Gemini AI init failed:', err.message);
  }
}

// ─── Auth Routes ───────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    if (dbConnected) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, passwordHash, phone, avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=' + encodeURIComponent(name) });
      const token = jwt.sign({ id: user._id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, role: 'user' }, token });
    }

    if (mockUsers[email]) return res.status(409).json({ error: 'Email already registered' });
    const newUser = { id: 'user-' + Date.now(), name, email, phone: phone || '', avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=' + encodeURIComponent(name), bio: '', preferences: { newsletter: true, smsNotifications: false } };
    mockUsers[email] = newUser;
    const token = jwt.sign({ id: newUser.id, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { ...newUser, role: 'user' }, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    // Demo accounts
    if (email === 'user@example.com' && password === 'password') {
      const profile = mockUsers['sarah.jenkins@example.com'];
      const token = jwt.sign({ id: profile.id, email: profile.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: { ...profile, role: 'user' }, token });
    }
    if (email === 'admin@example.com' && password === 'adminpass') {
      const profile = mockUsers['admin@example.com'];
      const token = jwt.sign({ id: profile.id, email: profile.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: { ...profile, role: 'admin' }, token });
    }

    // DB login
    if (dbConnected) {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      const role = email === 'admin@example.com' ? 'admin' : 'user';
      const token = jwt.sign({ id: user._id, email: user.email, role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, role }, token });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── Products Routes ───────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 50 } = req.query;

    if (dbConnected) {
      try {
        let query = {};
        if (category) query.category = category;
        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }];
        if (minPrice || maxPrice) { query.price = {}; if (minPrice) query.price.$gte = Number(minPrice); if (maxPrice) query.price.$lte = Number(maxPrice); }

        let dbQuery = Product.find(query);
        if (sort === 'Price: Low to High') dbQuery = dbQuery.sort({ price: 1 });
        else if (sort === 'Price: High to Low') dbQuery = dbQuery.sort({ price: -1 });
        else if (sort === 'Best Sellers') dbQuery = dbQuery.sort({ reviews: -1 });
        else dbQuery = dbQuery.sort({ createdAt: -1 });

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Product.countDocuments(query);
        const products = await dbQuery.skip(skip).limit(Number(limit)).lean();
        return res.json({ products, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
      } catch (dbErr) { console.error('DB products query failed:', dbErr.message); }
    }

    // Mock data fallback
    let results = [...seedProducts];
    if (category) results = results.filter(p => p.category === category);
    if (search) { const q = search.toLowerCase(); results = results.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)); }
    if (minPrice) results = results.filter(p => p.price >= Number(minPrice));
    if (maxPrice) results = results.filter(p => p.price <= Number(maxPrice));
    if (sort === 'Price: Low to High') results.sort((a, b) => a.price - b.price);
    else if (sort === 'Price: High to Low') results.sort((a, b) => b.price - a.price);
    else if (sort === 'Best Sellers') results.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));

    const skip = (Number(page) - 1) * Number(limit);
    const paged = results.slice(skip, skip + Number(limit));
    res.json({ products: paged, pagination: { page: Number(page), limit: Number(limit), total: results.length, pages: Math.ceil(results.length / Number(limit)) } });
  } catch (err) {
    console.error('Products API error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await getProductByIdFromSource(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Product by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ─── User/Profile Routes ──────────────────────────────────────
app.get('/api/user/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email parameter required' });

    if (dbConnected) {
      try {
        const user = await User.findOne({ email }).select('-passwordHash').lean();
        if (user) return res.json(user);
      } catch (dbErr) { console.error('DB profile lookup failed:', dbErr.message); }
    }

    if (mockUsers[email]) return res.json(mockUsers[email]);
    return res.status(404).json({ error: 'Profile not found' });
  } catch (err) {
    console.error('User profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/user/profile', async (req, res) => {
  try {
    const { email, ...updates } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    if (dbConnected) {
      try {
        const user = await User.findOneAndUpdate({ email }, updates, { new: true }).select('-passwordHash').lean();
        if (user) return res.json(user);
      } catch (dbErr) { console.error('DB profile update failed:', dbErr.message); }
    }

    if (mockUsers[email]) {
      mockUsers[email] = { ...mockUsers[email], ...updates, email };
      return res.json(mockUsers[email]);
    }
    return res.status(404).json({ error: 'User not found' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─── Orders Routes ─────────────────────────────────────────────
app.get('/api/user/orders', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email parameter required' });

    if (dbConnected) {
      try {
        const orders = await Order.find().sort({ createdAt: -1 }).lean();
        if (orders.length > 0) return res.json(orders);
      } catch (dbErr) { console.error('DB orders lookup failed:', dbErr.message); }
    }

    const userOrders = mockOrders
      .filter(order => order.customerEmail === email)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(userOrders);
  } catch (err) {
    console.error('User orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/user/orders', async (req, res) => {
  try {
    const { items, total, email, shippingAddress, paymentMethod } = req.body;
    if (!items?.length || !total || !email) return res.status(400).json({ error: 'Items, total, and email are required' });

    if (dbConnected) {
      try {
        const order = await Order.create({
          user: email, items: items.map(item => ({ product: item.productId || item.id, quantity: item.quantity, priceAtPurchase: item.price })),
          total, status: 'Processing', shippingAddress, paymentMethod: paymentMethod || 'UPI / QR Scan',
        });
        return res.status(201).json(order);
      } catch (dbErr) { console.error('DB order creation failed:', dbErr.message); }
    }

    const userProfile = mockUsers[email];
    const newOrder = {
      id: 'ORD-' + (Math.floor(Math.random() * 9000) + 1000),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      customerName: userProfile?.name || 'Guest', customerEmail: email,
      items: items.map(item => ({ productId: item.productId || item.id, name: item.name, image: item.image, quantity: item.quantity, price: item.price })),
      total, status: 'Processing',
      shippingAddress: shippingAddress || (mockOrders[0] && mockOrders[0].shippingAddress),
      paymentMethod: paymentMethod || 'UPI / QR Scan',
    };
    mockOrders.unshift(newOrder);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─── Admin Routes ──────────────────────────────────────────────
app.get('/api/admin/stats', async (req, res) => {
  try {
    let productCount = seedProducts.length;
    let orderCount = mockOrders.length;
    let totalRevenue = mockOrders.reduce((sum, o) => sum + o.total, 0);
    let userCount = Object.keys(mockUsers).length;

    if (dbConnected) {
      try {
        productCount = await Product.countDocuments();
        orderCount = await Order.countDocuments();
        const revenueAgg = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
        totalRevenue = revenueAgg[0]?.total || totalRevenue;
        userCount = await User.countDocuments();
      } catch (dbErr) { console.error('DB stats query failed:', dbErr.message); }
    }

    res.json({ products: productCount, orders: orderCount, revenue: totalRevenue, users: userCount, salesData });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    if (dbConnected) {
      try { const orders = await Order.find().sort({ createdAt: -1 }).lean(); if (orders.length > 0) return res.json(orders); } catch (dbErr) { }
    }
    res.json(mockOrders);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

app.patch('/api/admin/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    if (dbConnected) {
      try { const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean(); if (order) return res.json(order); } catch (dbErr) { }
    }

    const mockOrder = mockOrders.find(o => o.id === req.params.id);
    if (mockOrder) { mockOrder.status = status; return res.json(mockOrder); }
    res.status(404).json({ error: 'Order not found' });
  } catch (err) { res.status(500).json({ error: 'Failed to update order' }); }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const { name, category, price, description, image, stock, badge } = req.body;
    if (!name || !category || !price) return res.status(400).json({ error: 'Name, category, and price are required' });

    if (dbConnected) {
      try { const product = await Product.create({ name, category, price, description, image, stock, badge }); return res.status(201).json(product); } catch (dbErr) { }
    }

    const newProduct = { id: String(seedProducts.length + 1), name, category, price, description, image, stock: stock || 0, badge, rating: 0, reviews: 0 };
    seedProducts.push(newProduct);
    res.status(201).json(newProduct);
  } catch (err) { res.status(500).json({ error: 'Failed to create product' }); }
});

app.put('/api/admin/products/:id', async (req, res) => {
  try {
    if (dbConnected) {
      try { const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean(); if (product) return res.json(product); } catch (dbErr) { }
    }
    const idx = seedProducts.findIndex(p => p.id === req.params.id);
    if (idx !== -1) { seedProducts[idx] = { ...seedProducts[idx], ...req.body }; return res.json(seedProducts[idx]); }
    res.status(404).json({ error: 'Product not found' });
  } catch (err) { res.status(500).json({ error: 'Failed to update product' }); }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    if (dbConnected) {
      try { const product = await Product.findByIdAndDelete(req.params.id); if (product) return res.json({ message: 'Product deleted' }); } catch (dbErr) { }
    }
    const idx = seedProducts.findIndex(p => p.id === req.params.id);
    if (idx !== -1) { seedProducts.splice(idx, 1); return res.json({ message: 'Product deleted' }); }
    res.status(404).json({ error: 'Product not found' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete product' }); }
});

// ─── AI Routes ─────────────────────────────────────────────────
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

    const systemPrompt = 'You are GiftBot for ToyWonder toy shop. Language: ' + (language === 'bn' ? 'Bengali' : 'English') + '.\n' +
      'Available: Speed Racer RC (₹3,499), Castle Builder Set (₹7,999), Cuddly Elephant (₹1,699), Mega Art Kit (₹2,999), Super Galactic Robot (₹3,999), Wooden Express Train (₹2,499), Cuddly Brown Bear (₹2,199), Rainbow Stacker (₹1,199), Surprise Gift Box (₹1,699).\n' +
      'Recommend specific products. Keep under 80 words. Be cheerful. Use emojis.';

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: systemPrompt + '\n\nCustomer: ' + message,
    });
    res.json({ text: result.text || 'I\'d love to help! What kind of toy are you looking for? 🎁' });
  } catch (err) {
    console.error('AI chat error:', err);
    // Return fallback response with 200 so frontend still works
    const input = (req.body.message || '').toLowerCase();
    let fallback = 'I\'m having a little trouble right now. Try browsing our Educational, Plushies, or Outdoor Fun categories! 🎁';
    if (input.includes('robot')) fallback = 'Check out our Super Galactic Robot (₹3,999)! It\'s our best-seller. 🤖';
    else if (input.includes('gift')) fallback = 'Our Surprise Gift Box (₹1,699) is always a hit! 🎁';
    res.json({ text: fallback });
  }
});

app.post('/api/ai/recommend', aiLimiter, async (req, res) => {
  try {
    const { history = [] } = req.body;

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
      recommendations = await Product.find({ category: { $in: categories } }).limit(4).lean();
    } else {
      recommendations = seedProducts.filter(p => categories.includes(p.category)).slice(0, 4);
    }
    if (recommendations.length === 0) recommendations = (await getProductsFromSource()).slice(0, 4);
    res.json(recommendations);
  } catch (err) {
    console.error('Recommendation error:', err);
    const fallback = (await getProductsFromSource()).slice(0, 4);
    res.json(fallback);
  }
});

app.post('/api/ai/search-recommend', aiLimiter, async (req, res) => {
  try {
    const { searchQuery } = req.body;
    if (!searchQuery?.trim()) return res.json([]);

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
    const allProducts = await getProductsFromSource();
    const q = (req.body.searchQuery || '').toLowerCase();
    res.json(allProducts.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 6));
  }
});

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

    const prompt = 'You are a voice assistant for ToyWonder toy shop.\nCustomer said: "' + message + '"\nAvailable: Speed Racer RC (₹3,499), Castle Builder Set (₹7,999), Cuddly Elephant (₹1,699), Mega Art Kit (₹2,999), Super Galactic Robot (₹3,999), Wooden Express Train (₹2,499), Cuddly Brown Bear (₹2,199), Rainbow Stacker (₹1,199), Surprise Gift Box (₹1,699).\nReply concisely (under 50 words). Be warm.' + (language === 'bn' ? ' Reply in Bengali.' : '');
    const result = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
    res.json({ text: result.text || "I'd love to help! What are you looking for? 🎁" });
  } catch (err) {
    console.error('Voice AI error:', err);
    res.json({ text: "I'm having trouble connecting right now, but try browsing our Educational, Plushies, or Outdoor Fun categories!" });
  }
});

// ─── DB Seeding ────────────────────────────────────────────────
app.post('/api/admin/seed', async (req, res) => {
  try {
    if (!dbConnected) return res.status(503).json({ error: 'Database not connected' });
    await Product.deleteMany({});
    const products = await Product.insertMany(seedProducts.map(p => ({
      name: p.name, category: p.category, price: p.price, originalPrice: p.originalPrice,
      rating: p.rating, reviews: p.reviews, image: p.image, badge: p.badge,
      description: p.description, specs: p.specs ? new Map(Object.entries(p.specs)) : undefined, stock: p.stock,
    })));
    res.json({ message: 'Seeded ' + products.length + ' products', count: products.length });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

// ─── Catch-all & Error Handler ─────────────────────────────────
app.use('/api/{*path}', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Graceful Shutdown ─────────────────────────────────────────
const shutdown = async (signal) => {
  console.log('\n' + signal + ' received. Shutting down...');
  if (dbConnected) { await mongoose.connection.close(); }
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\nToyWonder API Server');
  console.log('  Environment: ' + NODE_ENV);
  console.log('  Port: ' + PORT);
  console.log('  MongoDB: ' + (dbConnected ? 'connected' : 'mock data mode'));
  console.log('  AI: ' + (ai ? 'enabled' : 'disabled'));
  console.log('  Health: http://localhost:' + PORT + '/api/health\n');
});
