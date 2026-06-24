// ═══════════════════════════════════════════════════════════════
// ADMIN API SERVICE - Secured Admin Operations
// ═══════════════════════════════════════════════════════════════

interface AdminStats {
    products: number;
    orders: number;
    revenue: number;
    users: number;
    salesData: any;
}

interface Order {
    id: string;
    userId: string;
    items: any[];
    total: number;
    status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: string;
    updatedAt?: string;
}

interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatar?: string;
    createdAt?: string;
}

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    image?: string;
    description?: string;
    badge?: string;
}

interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

// ─── Helper: API Call with Auth ────────────────────────────────
const apiCall = async (
    method: string,
    endpoint: string,
    body?: any
): Promise<any> => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Unauthorized: No token found');
    }

    const response = await fetch(`/api${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired');
    }

    if (response.status === 403) {
        throw new Error('Forbidden: Admin access required');
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
};

// ─── Stats API ─────────────────────────────────────────────────
export const getAdminStats = async (): Promise<AdminStats> => {
    return apiCall('GET', '/admin/stats');
};

// ─── Orders API ────────────────────────────────────────────────
export const getOrders = async (
    page: number = 1,
    limit: number = 20,
    status?: string,
    startDate?: string,
    endDate?: string,
    customerId?: string
): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (status) params.set('status', status);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (customerId) params.set('customerId', customerId);

    const response = await apiCall('GET', `/admin/orders?${params}`);
    return {
        data: response.orders,
        total: response.total,
        page: response.page,
        limit: response.limit,
        pages: response.pages,
    };
};

export const updateOrderStatus = async (
    orderId: string,
    status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
): Promise<Order> => {
    return apiCall('PATCH', `/admin/orders/${orderId}`, { status });
};

// ─── Products API ──────────────────────────────────────────────
export const createProduct = async (product: Partial<Product>): Promise<Product> => {
    return apiCall('POST', '/admin/products', product);
};

export const updateProduct = async (
    productId: string,
    product: Partial<Product>
): Promise<Product> => {
    return apiCall('PUT', `/admin/products/${productId}`, product);
};

export const deleteProduct = async (productId: string): Promise<{ message: string }> => {
    return apiCall('DELETE', `/admin/products/${productId}`);
};

// ─── Users API ─────────────────────────────────────────────────
export const getUsers = async (
    page: number = 1,
    limit: number = 20,
    search?: string
): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);

    const response = await apiCall('GET', `/admin/users?${params}`);
    return {
        data: response.users,
        total: response.total,
        page: response.page,
        limit: response.limit,
        pages: response.pages,
    };
};

export const getUserDetails = async (userId: string): Promise<User> => {
    return apiCall('GET', `/admin/users/${userId}`);
};

export const deleteUser = async (userId: string): Promise<{ message: string }> => {
    return apiCall('DELETE', `/admin/users/${userId}`);
};

// ─── Reports API ───────────────────────────────────────────────
export interface ReportSummary {
    totalOrders: number;
    totalRevenue: number;
    ordersByStatus: Array<{ _id: string; count: number }>;
    topProducts: Array<{ _id: string; count: number }>;
}

export const getReportSummary = async (
    startDate?: string,
    endDate?: string
): Promise<ReportSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    return apiCall('GET', `/admin/reports/summary?${params}`);
};

// ─── Batch Operations ──────────────────────────────────────────
export const seedDatabase = async (): Promise<{ message: string; count: number }> => {
    return apiCall('POST', '/admin/seed', {});
};
