
import React, { useState, useEffect, useMemo } from 'react';
import { products as initialProducts } from '../data';
import { orders as initialOrders } from '../data';
import { Product, Order } from '../types';
import { formatPrice } from '../utils/formatters';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'settings';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('isAdminAuthenticated') === 'true');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
      sessionStorage.removeItem('isAdminAuthenticated');
      setIsAuthenticated(false);
  }

  const handleSaveProduct = (productData: Product) => {
    if (editingProduct) {
      // Update existing product
      setProducts(products.map(p => p.id === productData.id ? productData : p));
    } else {
      // Add new product
      const newProduct = { ...productData, id: `prod-${Date.now()}` };
      setProducts([newProduct, ...products]);
    }
    closeModal();
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
        setProducts(products.filter(p => p.id !== id));
    }
  };
  
  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };
  
  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const dashboardStats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const newOrders = orders.filter(o => o.status === 'Processing').length;
    const lowStockItems = products.filter(p => p.stock < 10).length;
    return { totalRevenue, newOrders, lowStockItems, totalProducts: products.length };
  }, [orders, products]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Access</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your password to manage ToyWonder.</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Password"
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div>
              <button type="submit" className="w-full px-4 py-3 font-bold text-black bg-primary rounded-lg hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                Unlock Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-body">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
        <div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
          <span className="material-symbols-outlined text-primary text-3xl">toys</span>
          <h1 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">ToyWonder</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {(['dashboard', 'products', 'orders', 'settings'] as AdminTab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-primary/20 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <span className="material-symbols-outlined mr-3">{
                  {dashboard: 'dashboard', products: 'inventory_2', orders: 'receipt_long', settings: 'settings'}[tab]
              }</span>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t dark:border-gray-700">
             <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <span className="material-symbols-outlined mr-3">logout</span>
                Logout
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Admin {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><h3 className="text-sm font-medium text-gray-500">Total Revenue</h3><p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{formatPrice(dashboardStats.totalRevenue)}</p></div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><h3 className="text-sm font-medium text-gray-500">New Orders</h3><p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{dashboardStats.newOrders}</p></div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3><p className="text-3xl font-bold text-red-500 mt-2">{dashboardStats.lowStockItems}</p></div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"><h3 className="text-sm font-medium text-gray-500">Total Products</h3><p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{dashboardStats.totalProducts}</p></div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Manage Products</h2>
                <button onClick={() => openModal()} className="bg-primary text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-sm">add</span> Add Product</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Product</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3">Price</th>
                            <th scope="col" className="px-6 py-3">Stock</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center gap-3"><img src={p.image} className="w-10 h-10 rounded-md object-cover" /> {p.name}</td>
                                <td className="px-6 py-4">{p.category}</td>
                                <td className="px-6 py-4">{formatPrice(p.price)}</td>
                                <td className={`px-6 py-4 font-bold ${p.stock < 10 ? 'text-red-500' : 'text-green-500'}`}>{p.stock}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => openModal(p)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}
        
        {/* Orders */}
        {activeTab === 'orders' && (
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                 <h2 className="text-xl font-bold mb-4">Customer Orders</h2>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                             <tr>
                                 <th className="px-6 py-3">Order ID</th>
                                 <th className="px-6 py-3">Date</th>
                                 <th className="px-6 py-3">Total</th>
                                 <th className="px-6 py-3">Status</th>
                             </tr>
                         </thead>
                         <tbody>
                             {orders.map(o => (
                                 <tr key={o.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                     <td className="px-6 py-4 font-bold">{o.id}</td>
                                     <td className="px-6 py-4">{o.date}</td>
                                     <td className="px-6 py-4">{formatPrice(o.total)}</td>
                                     <td className="px-6 py-4">
                                         <select 
                                             value={o.status} 
                                             onChange={(e) => handleOrderStatusChange(o.id, e.target.value as Order['status'])}
                                             className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                         >
                                             <option>Processing</option>
                                             <option>Shipped</option>
                                             <option>Delivered</option>
                                         </select>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
        )}
      </main>

      {/* Product Modal */}
      {isModalOpen && <ProductModal product={editingProduct} onSave={handleSaveProduct} onClose={closeModal} />}
    </div>
  );
};


const ProductModal: React.FC<{product: Product | null, onSave: (product: Product) => void, onClose: () => void}> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState<Product>(product || { id: '', name: '', category: 'Educational', price: 0, stock: 10, image: '', rating: 0, reviews: 0 });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">{product ? 'Edit Product' : 'Add New Product'}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                             <select name="category" value={formData.category} onChange={handleChange} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                {['Educational', 'Plushies', 'Outdoor Fun', 'Arts & Crafts', 'Robots', 'Gifts'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                            <input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Stock" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                            <input name="image" value={formData.image} onChange={handleChange} placeholder="Image URL" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 col-span-full" required />
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-primary text-black font-bold py-2 px-4 rounded-lg">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default Admin;
