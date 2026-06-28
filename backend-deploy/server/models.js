
import mongoose from 'mongoose';

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
  role: { type: String, default: 'customer' },
  portalAccess: { type: [String], default: ['customer'] },
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
  imageUrl: String,
  badge: String,
  description: String,
  specs: Map, // Key-value pairs for specs
  stock: { type: Number, default: 100 },
  isPublished: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now }
});

// --- Order Schema ---
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  price: Number,
  quantity: Number,
  image: String
});

const orderSchema = new mongoose.Schema({
  customerId: { type: String, required: true, index: true },
  customerEmail: String,
  customerName: String,
  items: [orderItemSchema],
  total: Number,
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'pending' },
  stripePaymentIntentId: { type: String, index: true },
  shippingAddress: addressSchema,
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
export const Product = mongoose.model('Product', productSchema);
export const Order = mongoose.model('Order', orderSchema);