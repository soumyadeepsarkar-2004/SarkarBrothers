import { Product, Order, Address, CartItem, UserProfile, AuthUser, UserRole } from '../types';
import { products as mockProducts, orders as mockOrders, mockUsers } from '../data';

// Configuration - controlled by env vars set via Vite define
const USE_MOCK_BACKEND = (process.env.USE_MOCK_BACKEND || 'true') === 'true';
const API_BASE_URL = process.env.API_BASE_URL || '/api';

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

  // --- Mock Authentication ---
  static async login(email: string, password: string): Promise<{ user: AuthUser, token: string } | null> {
    await simulateDelay(700);
    let role: UserRole | null = null;
    let userProfile: UserProfile | undefined;

    if (email === 'user@example.com' && password === 'password') {
      userProfile = mockUsers['sarah.jenkins@example.com'];
      role = 'user';
    } else if (email === 'admin@example.com' && password === 'adminpass') {
      userProfile = mockUsers['admin@example.com'];
      role = 'admin';
    }

    if (userProfile && role) {
      return {
        user: { ...userProfile, role },
        token: `mock-jwt-${userProfile.id}-${Date.now()}` // Mock token
      };
    }
    return null; // Invalid credentials
  }

  static async getUserProfile(userEmail: string): Promise<UserProfile> {
    await simulateDelay(500);
    const profile = mockUsers[userEmail];
    if (!profile) {
      // For Google Auth or unknown users, return a basic profile
      return {
        id: `user-${Date.now()}`,
        name: userEmail.split('@')[0],
        email: userEmail,
        phone: '',
        avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userEmail)}&backgroundColor=f4c025&radius=50`,
        bio: '',
        preferences: { newsletter: false, smsNotifications: false },
      };
    }
    return { ...profile }; // Return a clone
  }

  static async updateProfile(updatedProfile: UserProfile): Promise<UserProfile> {
    await simulateDelay(800);
    const existing = mockUsers[updatedProfile.email];
    if (existing) {
      mockUsers[updatedProfile.email] = { ...existing, ...updatedProfile };
      return mockUsers[updatedProfile.email];
    }
    // For Google Auth or new users, create a mock entry
    mockUsers[updatedProfile.email] = updatedProfile;
    return updatedProfile;
  }

  static async getOrders(userEmail: string): Promise<Order[]> {
    await simulateDelay(600);
    // Filter mock orders by customer email, plus include any dynamically created orders
    return [...mockOrders].filter(order => 
      order.customerEmail === userEmail || 
      order.customerEmail === 'sarah.jenkins@example.com' && userEmail === 'sarah.jenkins@example.com'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async createOrder(items: CartItem[], total: number, customerEmail?: string): Promise<Order> {
    await simulateDelay(1000);
    const userProfile = customerEmail ? mockUsers[customerEmail] : null;
    // Allow order creation even for users not in the mock database (e.g., Google Auth users)
    const customerName = userProfile?.name || customerEmail?.split('@')[0] || 'Customer';
    const customerEmailFinal = userProfile?.email || customerEmail || 'unknown@example.com';

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      customerName: customerName,
      customerEmail: customerEmailFinal,
      items: items.map(item => ({
        productId: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
      })),
      total: total,
      status: 'Processing',
      shippingAddress: mockOrders[0].shippingAddress, // Use an existing address for mock data
      paymentMethod: 'UPI / QR Scan',
    };
    mockOrders.unshift(newOrder); // Add to the beginning of the list
    return newOrder;
  }

  static async getRecommendations(history: string[]): Promise<Product[]> {
    await simulateDelay(800);
    if (history.length === 0) return mockProducts.slice(0, 3);

    // Simple mock logic: Find products in similar categories to history names
    // Real backend uses AI, here we just do a dumb keyword match
    const keywords = history.join(' ').toLowerCase();
    const recs = mockProducts.filter(p =>
      keywords.includes(p.category?.toLowerCase() || '') ||
      (p.name && keywords.includes(p.name.split(' ')[0]?.toLowerCase() || ''))
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
      if (filters.priceRange?.length) {
        const min = Math.min(...filters.priceRange.map(r => r.min));
        const max = Math.max(...filters.priceRange.map(r => r.max));
        query.append('minPrice', String(min));
        query.append('maxPrice', String(max));
      }
      if (filters.sort) query.append('sort', filters.sort);
      const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`);
      const data = await res.json();
      // Server returns { products, pagination } or an array
      return Array.isArray(data) ? data : (data.products || []);
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
    },

    getSearchRecommendations: async (searchQuery: string): Promise<Product[]> => {
      if (USE_MOCK_BACKEND) {
        // Enhanced mock logic for search recommendations
        await simulateDelay(800);
        const query = searchQuery.toLowerCase();

        // Find related products by category similarity
        const relatedProducts = mockProducts.filter(p => {
          const categoryMatch = p.category?.toLowerCase().includes(query);
          const nameMatch = p.name?.toLowerCase().includes(query);
          // Return products in similar categories but not exact matches
          return categoryMatch && !nameMatch;
        });

        // If no category matches, return products from popular categories
        if (relatedProducts.length === 0) {
          return mockProducts.filter(p =>
            ['Educational', 'Plushies', 'Robots'].includes(p.category || '')
          ).slice(0, 6);
        }

        return relatedProducts.slice(0, 6);
      }

      const res = await fetch(`${API_BASE_URL}/ai/search-recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery })
      });
      return res.json();
    }
  },

  user: {
    // New login function
    login: async (email: string, password: string) => {
      if (USE_MOCK_BACKEND) return MockBackend.login(email, password);
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(err.error || 'Login failed');
      }
      return res.json();
    },

    getProfile: async (userEmail: string) => { // Now requires email for mock lookup
      if (USE_MOCK_BACKEND) return MockBackend.getUserProfile(userEmail);
      const res = await fetch(`${API_BASE_URL}/user/profile?email=${userEmail}`); // Pass email for server-side mock
      return res.json();
    },

    updateProfile: async (data: UserProfile) => {
      if (USE_MOCK_BACKEND) { return MockBackend.updateProfile(data); }
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },

    getOrders: async (userEmail: string) => { // Now requires email for mock lookup
      if (USE_MOCK_BACKEND) return MockBackend.getOrders(userEmail);
      const res = await fetch(`${API_BASE_URL}/user/orders?email=${userEmail}`); // Pass email for server-side mock
      return res.json();
    },

    createOrder: async (items: CartItem[], total: number, customerEmail?: string) => {
      if (USE_MOCK_BACKEND) return MockBackend.createOrder(items, total, customerEmail);
      const res = await fetch(`${API_BASE_URL}/user/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total, email: customerEmail }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Order creation failed' }));
        throw new Error(err.error || 'Order creation failed');
      }
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'AI chat failed' }));
        throw new Error(err.error || 'AI chat failed');
      }
      return res.json();
    },

    voice: async (message: string, language: 'en' | 'bn' = 'en') => {
      if (USE_MOCK_BACKEND) {
        throw new Error("Mock backend delegates to client-side AI");
      }
      const res = await fetch(`${API_BASE_URL}/ai/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Voice AI failed' }));
        throw new Error(err.error || 'Voice AI failed');
      }
      return res.json();
    }
  }
};