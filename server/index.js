
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenAI } = require("@google/genai");
const { User, Product, Order } = require('./models');
const { mockUsers, orders: mockOrders } = require('../data'); // Import mockUsers and orders from data.ts

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/toywonder')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. User/Profile API (Mock Auth middleware assumed)
// In a real app, this would be authenticated and return the profile of the logged-in user
app.get('/api/user/profile', async (req, res) => {
  const { email } = req.query; // Assume email is passed for mock lookup
  if (email && mockUsers[email]) {
    return res.json(mockUsers[email]);
  }
  // Fallback to a generic profile or error if no email/user found
  return res.status(404).json({ message: 'Profile not found or not logged in' });
});

app.put('/api/user/profile', async (req, res) => {
  // const userId = req.user.id;
  // const updatedUser = await User.findByIdAndUpdate(userId, req.body, { new: true });
  // For mock: just echo back the updated data
  const { email } = req.body;
  if (email && mockUsers[email]) {
    mockUsers[email] = { ...mockUsers[email], ...req.body }; // Update mock user
    return res.json(mockUsers[email]);
  }
  res.status(404).json({ message: 'Profile not found or not authorized' });
});

app.get('/api/user/orders', async (req, res) => {
    const { email } = req.query; // Assume email is passed for mock lookup
    if (email) {
        // Return mock orders for the specific user
        const userOrders = mockOrders.filter(order => order.customerEmail === email);
        return res.json(userOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    res.status(404).json({ message: 'Orders not found for this user' });
});

// 3. AI Assistant & Recommendations API 
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, language } = req.body;
    
    const systemPrompt = `You are GiftBot for ToyWonder. Language: ${language === 'bn' ? 'Bengali' : 'English'}. Recommend toys based on user input. Keep it short.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: message }], // Corrected format
      config: { systemInstruction: systemPrompt }
    });

    res.json({ text: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI Service Unavailable" });
  }
});

// New Endpoint: Intelligent Recommendations
app.post('/api/ai/recommend', async (req, res) => {
    try {
        const { history } = req.body; // Array of product names/categories viewed
        
        if (!history || history.length === 0) {
            // Fallback to random products if no history
            const randomProducts = await Product.aggregate([{ $sample: { size: 3 } }]);
            return res.json(randomProducts);
        }

        // Use AI to determine category relevance
        const prompt = `
            User has viewed: ${history.join(', ')}.
            Based on this browsing history, identify the top 2 most relevant toy categories from this list: 
            [Educational, Outdoor Fun, Plushies, Arts & Crafts, Robots, Gifts].
            Return ONLY the category names separated by commas.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: prompt }] // Corrected format
        });

        const suggestedCategories = response.text.split(',').map(s => s.trim());
        
        // Fetch products from DB matching these categories
        const recommendations = await Product.find({ 
            category: { $in: suggestedCategories } 
        }).limit(4);

        res.json(recommendations);

    } catch (err) {
        console.error("Recommendation Error", err);
        // Fallback
        const fallback = await Product.find().limit(4);
        res.json(fallback);
    }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});