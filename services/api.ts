import { Product, Order, Address, CartItem, UserProfile, AuthUser, UserRole } from '../types';
import { products as mockProducts, orders as mockOrders, mockUsers } from '../data';

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
    if (!profile) throw new Error("Mock profile not found");
    return { ...profile }; // Return a clone
  }

  static async updateProfile(updatedProfile: UserProfile): Promise<UserProfile> {
    await simulateDelay(800);
    const existing = mockUsers[updatedProfile.email];
    if (existing) {
        mockUsers[updatedProfile.email] = { ...existing, ...updatedProfile };
        return mockUsers[updatedProfile.email];
    }
    throw new Error("Mock profile not found for update");
  }

  static async getOrders(userEmail: string): Promise<Order[]> {
    await simulateDelay(600);
    // Filter mock orders by customer email
    return [...mockOrders].filter(order => order.customerEmail === userEmail).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  static async createOrder(items: CartItem[], total: number, customerEmail?: string): Promise<Order> {
    await simulateDelay(1000);
    const userProfile = customerEmail ? mockUsers[customerEmail] : null;
    if (!userProfile) throw new Error("Customer profile not found for order creation");

    const newOrder: Order = {
        id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        customerName: userProfile.name,
        customerEmail: userProfile.email,
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
    // New login function
    login: async (email: string, password: string) => {
        if (USE_MOCK_BACKEND) return MockBackend.login(email, password);
        // In a real app, this would be a POST request to your auth endpoint
        // const res = await fetch(`${API_BASE_URL}/auth/login`, { ... });
        throw new Error("Real login not implemented in this demo.");
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
        // Real API call would go here, often without needing email directly if session is managed
        return {} as Order;
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