
const mongoose = require('mongoose');

// --- User Schema ---
const addressSchema = new mongoose.Schema({
  name: String,
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String,
  isDefault: Boolean,
  coordinates: {
    lat: Number,
    lng: Number
  }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // Store hashed passwords
  name: String,
  phone: String,
  avatar: String,
  bio: String,
  preferences: {
    newsletter: Boolean,
    smsNotifications: Boolean
  },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdAt: { type: Date, default: Date.now }
});

// --- Product Schema ---
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  image: String,
  badge: String,
  description: String,
  specs: Map, // Key-value pairs for specs
  stock: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now }
});

// --- Order Schema ---
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: Number,
  priceAtPurchase: Number
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  total: Number,
  status: { 
    type: String, 
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Processing' 
  },
  shippingAddress: addressSchema,
  paymentMethod: String,
  paymentId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Product: mongoose.model('Product', productSchema),
  Order: mongoose.model('Order', orderSchema)
};
