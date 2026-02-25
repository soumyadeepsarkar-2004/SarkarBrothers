import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './models.js';
import { products } from './data.js';

const seed = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set. Add it to .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert seed data
    const seeded = await Product.insertMany(products.map(p => ({
      name: p.name,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      rating: p.rating,
      reviews: p.reviews,
      image: p.image,
      badge: p.badge,
      description: p.description,
      specs: p.specs ? new Map(Object.entries(p.specs)) : undefined,
      stock: p.stock,
    })));

    console.log('Seeded ' + seeded.length + ' products successfully!');
    seeded.forEach(p => console.log('  - ' + p.name + ' (' + p.category + ') - ID: ' + p._id));
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

seed();
