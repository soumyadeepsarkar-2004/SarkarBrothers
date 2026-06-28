import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Admin Pages
const AdminDashboard = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/admin/analytics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setAnalytics(data);
            } catch (e) {
                console.error("Failed to load analytics", e);
            }
        };
        fetchAnalytics();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-4">Owner Dashboard</h1>
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-100 p-6 rounded-lg">
                    <p className="text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{analytics?.totalRevenue?.toLocaleString('en-IN') || 0}</p>
                </div>
                <div className="bg-green-100 p-6 rounded-lg">
                    <p className="text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold">{analytics?.totalOrders || 0}</p>
                </div>
                <div className="bg-purple-100 p-6 rounded-lg">
                    <p className="text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold">{analytics?.totalCustomers || 0}</p>
                </div>
                <div className="bg-orange-100 p-6 rounded-lg">
                    <p className="text-gray-600">Pending Orders</p>
                    <p className="text-2xl font-bold">{analytics?.pendingOrdersCount || 0}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined">warning</span> Low Stock Alerts
                </h2>
                {analytics?.lowStockProducts?.length > 0 ? (
                    <ul className="divide-y">
                        {analytics.lowStockProducts.map((p: any, i: number) => (
                            <li key={i} className="py-3 flex justify-between items-center">
                                <span className="font-medium">{p.name}</span>
                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                                    {p.stock} left
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">All products are adequately stocked.</p>
                )}
            </div>
        </div>
    );
};

const ProductManagement = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', price: '', category: '', description: '', stock: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setProducts(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, (formData as any)[key]));
        if (imageFile) data.append('image', imageFile);

        try {
            await fetch(`${API_URL}/api/admin/products/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });
            setShowForm(false);
            fetchProducts();
        } catch (e) {
            console.error(e);
        }
    };

    const handlePublish = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/admin/products/${id}/publish`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchProducts();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8">Product Management</h1>
            <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4">
                {showForm ? 'Cancel' : 'Add New Product'}
            </button>
            
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8 space-y-4">
                    <input type="text" placeholder="Name" className="border p-2 w-full" onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <input type="number" placeholder="Price" className="border p-2 w-full" onChange={e => setFormData({...formData, price: e.target.value})} required />
                    <input type="text" placeholder="Category" className="border p-2 w-full" onChange={e => setFormData({...formData, category: e.target.value})} required />
                    <input type="number" placeholder="Stock" className="border p-2 w-full" onChange={e => setFormData({...formData, stock: e.target.value})} required />
                    <textarea placeholder="Description" className="border p-2 w-full" onChange={e => setFormData({...formData, description: e.target.value})} />
                    <input type="file" accept="image/*" onChange={e => { if (e.target.files) setImageFile(e.target.files[0]) }} className="border p-2 w-full" />
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Upload Product</button>
                </form>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left">Image</th>
                            <th className="px-6 py-3 text-left">Product</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p._id || p.id} className="border-t">
                                <td className="px-6 py-3">
                                    {(p.imageUrl || p.image) ? (
                                        <img src={p.imageUrl || p.image} alt={p.name} className="w-16 h-16 object-cover rounded" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">No Img</div>
                                    )}
                                </td>
                                <td className="px-6 py-3">{p.name}</td>
                                <td className="px-6 py-3">
                                    {p.isPublished ? <span className="text-green-600 font-bold">Published</span> : <span className="text-orange-500 font-bold">Draft</span>}
                                </td>
                                <td className="px-6 py-3 space-x-2">
                                    {!p.isPublished && (
                                        <button onClick={() => handlePublish(p._id || p.id)} className="bg-blue-500 text-white px-3 py-1 rounded">Publish</button>
                                    )}
                                    <button className="text-red-600 px-3 py-1">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && <tr><td colSpan={4} className="px-6 py-3 text-center">No products found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const OrderManagement = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setOrders(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/admin/orders/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8">Order Management</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.map(order => (
                            <tr key={order._id}>
                                <td className="px-6 py-4 text-sm font-medium">{order._id.slice(-6)}</td>
                                <td className="px-6 py-4 text-sm">{order.customerName}</td>
                                <td className="px-6 py-4 text-sm">₹{order.total}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <select 
                                        value={order.status}
                                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                        className="border rounded p-1 text-xs"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// DBA Console Component
const DBAConsole = () => {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8 text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-4xl">database</span>
                Secure DBA Console
            </h1>
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-600 mb-8">
                <h2 className="text-xl font-bold mb-4">Database Health Diagnostics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Status</p>
                        <p className="text-green-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span> Connected</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Latency</p>
                        <p className="font-bold">24ms</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Active Pools</p>
                        <p className="font-bold">5 / 100</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Uptime</p>
                        <p className="font-bold">99.9%</p>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Live User Role Modification</h2>
                <p className="text-gray-500 text-sm mb-4">Advanced user management functions are restricted to DBA and Admin roles.</p>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-xs font-bold text-gray-600 uppercase">User Email</th>
                                <th className="px-4 py-2 text-xs font-bold text-gray-600 uppercase">Current Role</th>
                                <th className="px-4 py-2 text-xs font-bold text-gray-600 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <tr>
                                <td className="px-4 py-3 font-medium text-sm">owner@sarkarbrothers.com</td>
                                <td className="px-4 py-3"><span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded">OWNER</span></td>
                                <td className="px-4 py-3"><button className="text-blue-600 text-sm hover:underline font-bold">Modify</button></td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-sm">admin@sarkarbrothers.com</td>
                                <td className="px-4 py-3"><span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">ADMIN</span></td>
                                <td className="px-4 py-3"><button className="text-blue-600 text-sm hover:underline font-bold">Modify</button></td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-sm">dba@sarkarbrothers.com</td>
                                <td className="px-4 py-3"><span className="bg-black text-white text-xs font-bold px-2 py-1 rounded">DBA</span></td>
                                <td className="px-4 py-3"><button className="text-blue-600 text-sm hover:underline font-bold">Modify</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default function AdminApp() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const adminUserStr = localStorage.getItem('adminUser');
    const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null;
    const isDBA = adminUser?.role === 'admin' || adminUser?.role === 'dba';

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, portal: 'admin' })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                if (data.user.role === 'admin' || data.user.role === 'owner' || data.user.role === 'dba') {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                    setToken(data.token);
                    window.location.reload();
                } else {
                    setError('Access denied: Unauthorized role.');
                }
            } else {
                setError(data.error || 'Invalid credentials.');
            }
        } catch (err) {
            setError('Connection failed. Please check backend.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        setToken(null);
        window.location.reload();
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
                    <div className="text-center mb-6">
                        <img src="/image.svg" alt="Sarkar Brothers" className="h-16 mx-auto mb-4 object-contain" />
                        <h2 className="text-2xl font-bold text-gray-900">Owner Portal</h2>
                        <p className="text-sm text-gray-500 mt-1">Sign in to manage toys and orders</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50"
                                placeholder="owner@sarkarbrothers.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="flex h-screen bg-gray-100 overflow-hidden relative">
                {/* Mobile Top Navbar */}
                <div className="md:hidden w-full bg-gray-900 text-white h-16 flex items-center justify-between px-4 absolute top-0 left-0 z-20 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <img src="/image.svg" alt="Sarkar Brothers" className="h-10 object-contain" />
                        <span className="text-xs font-bold uppercase tracking-wider">Owner Portal</span>
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 focus:outline-none">
                        <span className="material-symbols-outlined text-3xl">menu</span>
                    </button>
                </div>

                {/* Sidebar (Desktop & Mobile drawer overlay) */}
                <div className={`
                    fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white p-6 space-y-6 flex flex-col shrink-0 z-30 transition-transform duration-300 transform
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                `}>
                    <div className="flex justify-between items-center md:block">
                        <div className="flex flex-col gap-2">
                            <img src="/image.svg" alt="Sarkar Brothers Logo" className="h-16 w-auto object-contain" />
                            <span className="text-xs text-gray-400 text-center font-bold tracking-wider uppercase">
                                Owner Portal
                            </span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white">
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>
                    <nav className="space-y-2 flex-1">
                        <Link to="/" onClick={() => setSidebarOpen(false)} className="block px-4 py-2 rounded hover:bg-gray-700 font-semibold">Dashboard</Link>
                        <Link to="/products" onClick={() => setSidebarOpen(false)} className="block px-4 py-2 rounded hover:bg-gray-700 font-semibold">Products</Link>
                        <Link to="/orders" onClick={() => setSidebarOpen(false)} className="block px-4 py-2 rounded hover:bg-gray-700 font-semibold">Orders</Link>
                        {isDBA && (
                            <Link to="/dba-console" onClick={() => setSidebarOpen(false)} className="block px-4 py-2 rounded hover:bg-gray-700 font-semibold text-red-400 mt-4 border-t border-gray-700 pt-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">database</span>
                                DBA Console
                            </Link>
                        )}
                    </nav>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors mt-auto flex items-center justify-center gap-2"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Dark overlay when mobile sidebar is open */}
                {sidebarOpen && (
                    <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden"></div>
                )}

                {/* Main Content Container */}
                <div className="flex-grow flex flex-col overflow-y-auto bg-gray-50 pt-16 md:pt-0 w-full">
                    <div className="flex-grow">
                        <Routes>
                            <Route path="/" element={<AdminDashboard />} />
                            <Route path="/products" element={<ProductManagement />} />
                            <Route path="/orders" element={<OrderManagement />} />
                            {isDBA && <Route path="/dba-console" element={<DBAConsole />} />}
                        </Routes>
                    </div>
                    
                    <footer className="bg-white text-gray-500 py-4 px-8 border-t border-gray-200 text-xs flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
                        <p>&copy; {new Date().getFullYear()} SarkarBrothers Owner Portal. All rights reserved.</p>
                        <div className="flex gap-4">
                            <span>Support: contact@sarkarbrothers.com</span>
                            <span>Tel: +91 72785 70727</span>
                        </div>
                    </footer>
                </div>
            </div>
        </BrowserRouter>
    );
}
