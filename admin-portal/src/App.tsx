import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Admin Pages
const AdminDashboard = () => (
    <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-100 p-6 rounded-lg">
                <p className="text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₹0</p>
            </div>
            <div className="bg-green-100 p-6 rounded-lg">
                <p className="text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-purple-100 p-6 rounded-lg">
                <p className="text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-orange-100 p-6 rounded-lg">
                <p className="text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold">0</p>
            </div>
        </div>
    </div>
);

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

const OrderManagement = () => (
    <div className="p-8">
        <h1 className="text-4xl font-bold mb-8">Order Management</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left">Order ID</th>
                        <th className="px-6 py-3 text-left">Customer</th>
                        <th className="px-6 py-3 text-left">Amount</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-left">Payment</th>
                        <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-t">
                        <td className="px-6 py-3">-</td>
                        <td className="px-6 py-3">-</td>
                        <td className="px-6 py-3">-</td>
                        <td className="px-6 py-3">-</td>
                        <td className="px-6 py-3">-</td>
                        <td className="px-6 py-3">
                            <button className="text-blue-600">View</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

// Admin Router
export default function AdminApp() {
    return (
        <BrowserRouter>
            <div className="flex h-screen">
                {/* Sidebar */}
                <div className="w-64 bg-gray-900 text-white p-6 space-y-6">
                    <h2 className="text-2xl font-bold">SarkarBrothers Admin</h2>
                    <nav className="space-y-2">
                        <a href="/" className="block px-4 py-2 rounded hover:bg-gray-700">Dashboard</a>
                        <a href="/products" className="block px-4 py-2 rounded hover:bg-gray-700">Products</a>
                        <a href="/orders" className="block px-4 py-2 rounded hover:bg-gray-700">Orders</a>
                        <a href="/analytics" className="block px-4 py-2 rounded hover:bg-gray-700">Analytics</a>
                        <a href="/settings" className="block px-4 py-2 rounded hover:bg-gray-700">Settings</a>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    <Routes>
                        <Route path="/" element={<AdminDashboard />} />
                        <Route path="/products" element={<ProductManagement />} />
                        <Route path="/orders" element={<OrderManagement />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}
