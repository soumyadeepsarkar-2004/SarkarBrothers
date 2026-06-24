// ═══════════════════════════════════════════════════════════════
// SHARED TYPES FOR MULTI-PORTAL ARCHITECTURE
// ═══════════════════════════════════════════════════════════════

export type UserRole = 'customer' | 'admin' | 'owner';
export type Portal = 'customer' | 'admin';

// ─── User & Authentication ─────────────────────────────────────
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    portalAccess: Portal[];
    avatar?: string;
    createdAt: string;
}

export interface JWTPayload {
    id: string;
    email: string;
    role: UserRole;
    portalAccess: Portal[];
    iat: number;
    exp: number;
}

export interface LoginRequest {
    email: string;
    password: string;
    portal: Portal;
}

export interface LoginResponse {
    user: AuthUser;
    token: string;
    refreshToken?: string;
}

// ─── Products ──────────────────────────────────────────────────
export interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    category: string;
    image: string;
    description: string;
    stock: number;
    rating: number;
    reviews: number;
    badge?: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string; // admin id
}

export interface ProductBulkUpload {
    name: string;
    price: number;
    originalPrice?: number;
    category: string;
    image: string;
    description: string;
    stock: number;
}

// ─── Orders ────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface CartItem {
    id: string;
    quantity: number;
}

export interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export interface Order {
    id: string;
    customerId: string;
    customerEmail: string;
    customerName: string;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethodId?: string; // Stripe ID
    shippingAddress: Address;
    createdAt: string;
    updatedAt: string;
    stripePaymentIntentId?: string;
}

// ─── Addresses ─────────────────────────────────────────────────
export interface Address {
    id: string;
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    isDefault: boolean;
}

// ─── Admin Analytics ───────────────────────────────────────────
export interface AnalyticsSummary {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
    topProducts: Array<{ id: string; name: string; sales: number }>;
    dailyRevenue: Array<{ date: string; revenue: number }>;
}

export interface AuditLog {
    id: string;
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    changes?: Record<string, any>;
    timestamp: string;
    ipAddress?: string;
}

// ─── Inventory ────────────────────────────────────────────────
export interface InventoryUpdate {
    productId: string;
    newStock: number;
    reason: 'sale' | 'restock' | 'correction' | 'damage';
}

// ─── Admin Actions ────────────────────────────────────────────
export interface AdminAction {
    type: 'product_create' | 'product_update' | 'product_delete' | 'order_update' | 'order_cancel' | 'order_refund' | 'bulk_upload';
    timestamp: string;
    performedBy: string;
    details: Record<string, any>;
}

// ─── API Response Envelope ────────────────────────────────────
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string | Record<string, any>;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        pages: number;
    };
}
