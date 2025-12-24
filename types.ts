

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

export interface Order {
  id: string;
  date: string;
  items: string[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
  thumbnails: string[];
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