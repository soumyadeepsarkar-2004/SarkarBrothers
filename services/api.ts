
import { Product, Order, Address } from '../types';
import { products as mockProducts, orders as mockOrders } from '../data';

// Configuration
const USE_MOCK_BACKEND = true; // Toggle this to false to use the real Node.js server
const API_BASE_URL = 'http://localhost:5000/api';

// --- Types ---
export interface ApiFilters {
  search?: string;
  categories?: string[];
  priceRange?: { min: number; max: number }[];
  sort?: string;
}

// --- Local Storage History Helper ---
export const saveToHistory = (productName: string) => {
    try {
        const history = JSON.parse(localStorage.getItem('viewedItems') || '[]');
        if (!history.includes(productName)) {
            const newHistory = [productName, ...history].slice(0, 10); // Keep last 10
            localStorage.setItem('viewedItems', JSON.stringify(newHistory));
        }
    } catch (e) {
        console.error("LS Error", e);
    }
};

export const getHistory = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem('viewedItems') || '[]');
    } catch (e) {
        return [];
    }
};

// --- Mock Backend Logic (Simulates Database) ---
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockBackend {
  static async getProducts(filters: ApiFilters): Promise<Product[]> {
    await simulateDelay(600);
    let results = [...mockProducts];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }

    if (filters.categories?.length) {
      results = results.filter(p => filters.categories!.includes(p.category));
    }

    if (filters.priceRange?.length) {
      results = results.filter(p => 
        filters.priceRange!.some(range => p.price >= range.min && p.price < range.max)
      );
    }

    if (filters.sort) {
      if (filters.sort === 'Price: Low to High') results.sort((a, b) => a.price - b.price);
      if (filters.sort === 'Price: High to Low') results.sort((a, b) => b.price - a.price);
      if (filters.sort === 'Best Sellers') results.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    }

    return results;
  }

  static async getProductById(id: string): Promise<Product | undefined> {
    await simulateDelay(400);
    return mockProducts.find(p => p.id === id);
  }

  static async getUserProfile() {
    await simulateDelay(500);
    return {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+91 98765 43210',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCU0jVydwO_BzTasvf11ZjkOxK8TbjCy26l_NVLd7PCYz5fcpsIcCX0IWjQPee7kNU9ypCADDv93ImEfaUWsAO3Ha6tcoyTx2cNGdiHRVR5nFj_qD4xiAh6brmbK9hnGVewKil-RoO4ecMGWEz37ZPkRZeINF_Gkn9U3tR8wF_ZWe5nadbzxcCHZ_7ahlTrqxZuf6bygLSwVWRdoNNFc9de4UGhOOx7qQ-uTTKwIMZoZVLiZwaQ-omKY8I7rDpduCsl3lTAPJM3AC2v',
      bio: 'Mom of two lovely energetic kids. Love finding educational toys!',
      preferences: { newsletter: true, smsNotifications: false }
    };
  }

  static async getOrders(): Promise<Order[]> {
    await simulateDelay(600);
    return mockOrders;
  }

  static async getRecommendations(history: string[]): Promise<Product[]> {
      await simulateDelay(800);
      if (history.length === 0) return mockProducts.slice(0, 3);
      
      // Simple mock logic: Find products in similar categories to history names
      // Real backend uses AI, here we just do a dumb keyword match
      const keywords = history.join(' ').toLowerCase();
      const recs = mockProducts.filter(p => 
          keywords.includes(p.category.toLowerCase()) || 
          keywords.includes(p.name.split(' ')[0].toLowerCase())
      );
      
      return recs.length > 0 ? recs.slice(0, 4) : mockProducts.slice(0, 4);
  }
}

// --- Real API Service ---
export const api = {
  products: {
    list: async (filters: ApiFilters): Promise<Product[]> => {
      if (USE_MOCK_BACKEND) return MockBackend.getProducts(filters);
      
      const query = new URLSearchParams();
      if (filters.search) query.append('search', filters.search);
      filters.categories?.forEach(c => query.append('category', c));
      // ... map other filters to query params
      const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`);
      return res.json();
    },
    
    get: async (id: string): Promise<Product | undefined> => {
      if (USE_MOCK_BACKEND) return MockBackend.getProductById(id);
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      return res.json();
    },

    getRecommendations: async (history: string[]): Promise<Product[]> => {
        if (USE_MOCK_BACKEND) return MockBackend.getRecommendations(history);
        const res = await fetch(`${API_BASE_URL}/ai/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history })
        });
        return res.json();
    }
  },

  user: {
    getProfile: async () => {
      if (USE_MOCK_BACKEND) return MockBackend.getUserProfile();
      const res = await fetch(`${API_BASE_URL}/user/profile`);
      return res.json();
    },
    
    updateProfile: async (data: any) => {
      if (USE_MOCK_BACKEND) { await simulateDelay(800); return data; }
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },

    getOrders: async () => {
      if (USE_MOCK_BACKEND) return MockBackend.getOrders();
      const res = await fetch(`${API_BASE_URL}/user/orders`);
      return res.json();
    }
  },

  ai: {
    chat: async (message: string, language: 'en' | 'bn') => {
      if (USE_MOCK_BACKEND) {
         throw new Error("Mock backend delegates to client-side AI"); 
      }
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language })
      });
      return res.json();
    }
  }
};
