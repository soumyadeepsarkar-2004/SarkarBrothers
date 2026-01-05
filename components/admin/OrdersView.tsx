
import React, { useState, useMemo } from 'react';
import { Order, OrderItem } from '../../types';
import { formatPrice } from '../../utils/formatters';

const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Order Details: {order.id}</h2>
                    <button onClick={onClose}><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="font-bold mb-2">Customer</h3>
                            <p>{order.customerName}</p>
                            <p>{order.customerEmail}</p>
                        </div>
                        <div>
                            <h3 className="font-bold mb-2">Shipping Address</h3>
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                        </div>
                    </div>
                    
                    <h3 className="font-bold mb-2">Items</h3>
                    <div className="space-y-2">
                        {order.items.map((item: OrderItem) => (
                             <div key={item.productId} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-md object-cover"/>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{item.name}</p>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 mt-auto flex justify-end font-bold text-lg">
                    Total: {formatPrice(order.total)}
                </div>
            </div>
        </div>
    );
};

interface OrdersViewProps {
    orders: Order[];
    onStatusChange: (orderId: string, newStatus: Order['status']) => void;
}

const ITEMS_PER_PAGE = 10;

const OrdersView: React.FC<OrdersViewProps> = ({ orders, onStatusChange }) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredOrders = useMemo(() => {
        return orders.filter(o =>
            (o.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (statusFilter === 'All' || o.status === statusFilter)
        );
    }, [orders, searchTerm, statusFilter]);

    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredOrders, currentPage]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    
    return (
        <div className="animate-[fadeIn_0.3s_ease-out]">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Orders</h1>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input type="text" placeholder="Search by Order ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                           className="md:col-span-2 p-2 w-full border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="p-2 w-full border rounded dark:bg-gray-700 dark:border-gray-600">
                        <option value="All">All Statuses</option>
                        {['Processing', 'Shipped', 'Delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                             <tr>
                                 <th className="px-6 py-3">Order ID</th>
                                 <th className="px-6 py-3 hidden md:table-cell">Date</th>
                                 <th className="px-6 py-3 hidden lg:table-cell">Customer</th>
                                 <th className="px-6 py-3">Total</th>
                                 <th className="px-6 py-3">Status</th>
                                 <th className="px-6 py-3">Actions</th>
                             </tr>
                         </thead>
                         <tbody>
                             {paginatedOrders.map(o => (
                                 <tr key={o.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                     <td className="px-6 py-4 font-bold text-primary">{o.id}</td>
                                     <td className="px-6 py-4 hidden md:table-cell">{o.date}</td>
                                     <td className="px-6 py-4 hidden lg:table-cell">{o.customerName}</td>
                                     <td className="px-6 py-4">{formatPrice(o.total)}</td>
                                     <td className="px-6 py-4">
                                         <select value={o.status} onChange={(e) => onStatusChange(o.id, e.target.value as Order['status'])}
                                             className="p-2 text-xs border rounded dark:bg-gray-700 dark:border-gray-600">
                                             <option>Processing</option>
                                             <option>Shipped</option>
                                             <option>Delivered</option>
                                         </select>
                                     </td>
                                     <td className="px-6 py-4">
                                        <button onClick={() => setSelectedOrder(o)} className="font-medium text-blue-600 hover:underline">View</button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm rounded-lg disabled:opacity-50">Previous</button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm rounded-lg disabled:opacity-50">Next</button>
                    </div>
                )}
            </div>
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        </div>
    );
};

export default OrdersView;
