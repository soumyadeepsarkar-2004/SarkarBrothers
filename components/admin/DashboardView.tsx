
import React, { useMemo } from 'react';
import { Product, Order } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { salesData } from '../../data';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
}

const StatCard: React.FC<{ title: string; value: string; icon: string; change?: string; changeType?: 'up' | 'down' }> = ({ title, value, icon, change, changeType }) => (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
                <p className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <span className="material-symbols-outlined">{icon}</span>
            </div>
        </div>
        {change && (
            <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${changeType === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                <span className="material-symbols-outlined text-sm">{changeType === 'up' ? 'trending_up' : 'trending_down'}</span>
                {change} vs last week
            </p>
        )}
    </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({ products, orders }) => {
  const dashboardStats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const newOrders = orders.filter(o => o.status === 'Processing').length;
    const lowStockItems = products.filter(p => p.stock < 10);
    return {
      totalRevenue,
      newOrders,
      lowStockItemsCount: lowStockItems.length,
      lowStockItems,
      totalProducts: products.length,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    };
  }, [orders, products]);

  const maxRevenue = useMemo(() => Math.max(...salesData.map(d => d.revenue)), []);

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={formatPrice(dashboardStats.totalRevenue)} icon="monitoring" change="+5.2%" changeType="up" />
        <StatCard title="New Orders" value={dashboardStats.newOrders.toString()} icon="shopping_cart" change="+2.1%" changeType="up" />
        <StatCard title="Avg. Order Value" value={formatPrice(dashboardStats.avgOrderValue)} icon="paid" change="-1.5%" changeType="down" />
        <StatCard title="Low Stock Items" value={dashboardStats.lowStockItemsCount.toString()} icon="inventory_2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg mb-4">Weekly Revenue</h2>
          <div className="flex items-end gap-2 sm:gap-4 h-64">
            {salesData.map(item => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                 <div className="relative w-full h-full flex items-end">
                    <div
                        className="w-full bg-primary/20 group-hover:bg-primary transition-all rounded-t-lg"
                        style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                    ></div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatPrice(item.revenue)}
                    </div>
                 </div>
                 <span className="text-xs font-medium text-gray-500">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg mb-4">Low on Stock</h2>
          <div className="space-y-4 max-h-72 overflow-y-auto">
            {dashboardStats.lowStockItems.length > 0 ? dashboardStats.lowStockItems.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">Stock left: <span className="font-bold text-red-500">{p.stock}</span></p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No low stock items. Great job!</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
