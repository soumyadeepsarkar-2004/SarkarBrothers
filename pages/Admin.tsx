
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { products as initialProducts } from '../data';
import { orders as initialOrders } from '../data';
import { Product, Order } from '../types';
import { formatPrice } from '../utils/formatters'; // Corrected path
import DashboardView from '../components/admin/DashboardView';
import ProductsView from '../components/admin/ProductsView';
import OrdersView from '../components/admin/OrdersView';
import SettingsView from '../components/admin/SettingsView';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export type AdminTab = 'dashboard' | 'products' | 'orders' | 'settings';

const Admin: React.FC = () => {
  const { isAuthenticated, role, logout, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || role !== 'admin')) {
      navigate('/');
    }
  }, [isAuthenticated, role, authLoading, navigate]);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const handleLogout = () => {
    logout(); // Use AuthContext logout
    navigate('/');
  };

  const handleSaveProduct = useCallback((productData: Product) => {
    setProducts(prev => {
      if (prev.find(p => p.id === productData.id)) {
        return prev.map(p => (p.id === productData.id ? productData : p));
      }
      const newProduct = { ...productData, id: `prod-${Date.now()}` };
      return [newProduct, ...prev];
    });
    showToast('Product saved successfully!');
  }, []);

  const handleDeleteProduct = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('Product deleted.');
    }
  }, []);

  const handleOrderStatusChange = useCallback((orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showToast(`Order ${orderId} status updated.`);
  }, []);

  // Show a loading indicator while auth is being checked
  if (authLoading || !isAuthenticated || role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-300">Checking access...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView orders={orders} products={products} />;
      case 'products': return <ProductsView products={products} onSave={handleSaveProduct} onDelete={handleDeleteProduct} />;
      case 'orders': return <OrdersView orders={orders} onStatusChange={handleOrderStatusChange} />;
      case 'settings': return <SettingsView showToast={showToast} />;
      default: return null;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-20 border-b dark:border-gray-700 shrink-0">
        <span className="material-symbols-outlined text-primary text-3xl">toys</span>
        <h1 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">SarkarBrothers</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {(['dashboard', 'products', 'orders', 'settings'] as AdminTab[]).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-primary/20 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <span className="material-symbols-outlined mr-3">{
              { dashboard: 'dashboard', products: 'inventory_2', orders: 'receipt_long', settings: 'settings' }[tab]
            }</span>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t dark:border-gray-700 shrink-0">
        <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <span className="material-symbols-outlined mr-3">logout</span>
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 font-body text-gray-800 dark:text-gray-200">
      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md hidden lg:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)}></div>
          <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 animate-[slideInLeft_0.3s_ease-out]">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm shrink-0 flex items-center justify-between px-6 lg:justify-end">
          <button className="lg:hidden text-gray-600 dark:text-gray-300" onClick={() => setSidebarOpen(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-sm">{user?.name || 'Admin'}</span>
            <img className="w-8 h-8 rounded-full" src={user?.avatar || "https://api.dicebear.com/8.x/initials/svg?seed=Admin&backgroundColor=f4c025,8a8060&backgroundType=solid,gradientLinear&radius=50"} alt="Admin" />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg z-50 animate-[fadeIn_0.3s_ease-out]">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Admin;
