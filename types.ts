

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  description?: string;
  specs?: Record<string, string>;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
  shippingAddress: Address;
  paymentMethod: string;
}

export interface Address {
  id: string;
  name: string; // Label (Home, Work)
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
  };
}

export type UserRole = 'user' | 'admin';

export interface AuthUser extends UserProfile {
  role: UserRole;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  firebaseEnabled: boolean;
}