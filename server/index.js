
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import { User, Product, Order } from './models.js';
import { mockUsers, orders as mockOrders } from './data.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection with improved error handling
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('⚠️  No MONGODB_URI found. Using mock data only.');
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Continuing with mock data...');
  }
};

connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// --- API Routes ---

// 1. Products API
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    let query = {};

    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let products = Product.find(query);

    if (sort === 'Price: Low to High') products = products.sort({ price: 1 });
    else if (sort === 'Price: High to Low') products = products.sort({ price: -1 });
    else if (sort === 'Best Sellers') products = products.sort({ reviews: -1 });
    else products = products.sort({ createdAt: -1 }); // Default Newest

    const results = await products.exec();
    res.json(results);
  } catch (err) {
    console.error('Products API error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Product by ID error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. User/Profile API (Mock Auth middleware assumed)
app.get('/api/user/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (email && mockUsers[email]) {
      return res.json(mockUsers[email]);
    }
    return res.status(404).json({ message: 'Profile not found or not logged in' });
  } catch (err) {
    console.error('User profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/profile', async (req, res) => {
  try {
    const { email } = req.body;
    if (email && mockUsers[email]) {
      mockUsers[email] = { ...mockUsers[email], ...req.body };
      return res.json(mockUsers[email]);
    }
    return res.status(404).json({ message: 'User not found' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/orders', async (req, res) => {
  try {
    const { email } = req.query;
    if (email) {
      const userOrders = mockOrders.filter(order => order.customerEmail === email);
      return res.json(userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    res.status(404).json({ message: 'Orders not found for this user' });
  } catch (err) {
    console.error('User orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. AI Assistant & Recommendations API 
let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.error('Failed to initialize Google GenAI:', err);
  }
}

app.post('/api/ai/chat', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: "AI Service not configured. Please set GEMINI_API_KEY." });
    }

    const { message, language } = req.body;
    const systemPrompt = `You are GiftBot for ToyWonder. Language: ${language === 'bn' ? 'Bengali' : 'English'}. Recommend toys based on user input. Keep it short.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${systemPrompt}\n\nUser: ${message}`,
    });

    res.json({ text: result.text });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: "AI Service Unavailable" });
  }
});

// New Endpoint: Intelligent Recommendations
app.post('/api/ai/recommend', async (req, res) => {
  try {
    const { history } = req.body;

    if (!history || history.length === 0) {
      const randomProducts = await Product.aggregate([{ $sample: { size: 3 } }]);
      return res.json(randomProducts);
    }

    if (!ai) {
      // Fallback without AI
      const fallback = await Product.find().limit(4);
      return res.json(fallback);
    }

    const prompt = `User has viewed: ${history.join(', ')}.
Based on this browsing history, identify the top 2 most relevant toy categories from this list: 
[Educational, Outdoor Fun, Plushies, Arts & Crafts, Robots, Gifts].
Return ONLY the category names separated by commas.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const suggestedCategories = (result.text || '').split(',').map(s => s.trim());

    const recommendations = await Product.find({
      category: { $in: suggestedCategories }
    }).limit(4);

    res.json(recommendations);
  } catch (err) {
    console.error("Recommendation Error", err);
    const fallback = await Product.find().limit(4);
    res.json(fallback);
  }
});

// New Endpoint: AI-Powered Search Recommendations
app.post('/api/ai/search-recommend', async (req, res) => {
  try {
    const { searchQuery } = req.body;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.json([]);
    }

    if (!ai) {
      // Fallback without AI
      const products = await Product.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } }
        ]
      }).limit(6);
      return res.json(products);
    }

    const prompt = `A customer searched for: "${searchQuery}".
Based on this search, identify the top 3-4 most relevant toy categories from: 
[Educational, Outdoor Fun, Plushies, Arts & Crafts, Robots, Gifts].
Consider direct matches, related concepts, age appropriateness, and activity types.
Return ONLY the category names separated by commas, ordered by relevance.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const suggestedCategories = (result.text || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 4);

    // Fetch products from DB matching these categories
    const recommendations = await Product.find({
      category: { $in: suggestedCategories }
    }).limit(6);

    res.json(recommendations);
  } catch (err) {
    console.error("Search recommendation error:", err);
    // Fallback
    const products = await Product.find({
      $or: [
        { name: { $regex: req.body.searchQuery, $options: 'i' } },
        { category: { $regex: req.body.searchQuery, $options: 'i' } }
      ]
    }).limit(6);
    res.json(products);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
