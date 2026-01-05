
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/formatters';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // Relative import

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, cartTotal, addToCart, clearCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Use AuthContext
  
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const shipping = cartTotal > 2000 ? 0 : 100;
  const total = cartTotal + shipping;

  const handleRemoveItem = (id: string, name: string) => {
      if (window.confirm(`Are you sure you want to remove "${name}" from your cart?`)) {
          removeFromCart(id);
      }
  };

  const handlePaymentConfirmation = async () => {
    if (!isAuthenticated || !user?.email) {
      alert("Please log in to complete your order.");
      navigate('/profile'); // Redirect to profile/login if not authenticated
      return;
    }

    setPaymentProcessing(true);
    try {
        // Pass the customer email to the createOrder API
        await api.user.createOrder(items, total, user.email);
        clearCart();
        setIsPaymentModalOpen(false);
        navigate('/profile?order_success=true');
    } catch (e) {
        console.error("Failed to create order", e);
        alert("There was an issue processing your order. Please try again.");
    } finally {
        setPaymentProcessing(false);
    }
  };

  const PaymentModal = () => {
      if (!isPaymentModalOpen) return null;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !paymentProcessing && setIsPaymentModalOpen(false)}>
            <div className="bg-white dark:bg-[#1f1b13] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out] border-4 border-primary/50" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-[#181611] dark:text-white">Complete Your Payment</h2>
                    <p className="text-sm text-[#8a8060] mt-1">Scan the QR with any UPI app</p>
                    <div className="my-6 flex flex-col items-center gap-4">
                        <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                           <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBM4R_ngBzCjy-ypr-KT0s7lT6L-j8bHy7LAVX_exqSbi2TqL_2XQvW8U3N9X6f-t8m_wJ-C0yOQ1p116-vF-4A9VlP6TjQJ9PjQYxK85r00s90yFp510p_E-dJ960y2Q876Q3lQj3t-0iC9k_lq9J-M6lB8x9o2Gg" alt="UPI QR Code" className="w-48 h-48" />
                        </div>
                        <div className="bg-[#f5f3f0] dark:bg-[#2a261a] w-full p-3 rounded-lg">
                            <span className="text-sm text-[#8a8060]">Amount to Pay</span>
                            <p className="text-3xl font-extrabold text-[#181611] dark:text-white tracking-tighter">{formatPrice(total)}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                         <button 
                            onClick={handlePaymentConfirmation}
                            disabled={paymentProcessing}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:bg-gray-400"
                        >
                            {paymentProcessing ? (
                                <>
                                 <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                 <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                 <span className="material-symbols-outlined">verified</span>
                                 <span>I have paid, Confirm Order</span>
                                </>
                            )}
                        </button>
                        <button onClick={() => setIsPaymentModalOpen(false)} disabled={paymentProcessing} className="text-sm text-[#8a8060] font-bold hover:text-red-500">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  if (loading) { /* ... existing loading UI ... */ }

  return (
    <div className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10 max-w-3xl mx-auto">
            {/* ... Stepper UI ... */}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow lg:w-2/3 space-y-8">
                <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="space-y-6">
                        {items.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">production_quantity_limits</span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('cart.empty')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-6">Looks like you haven't made your choice yet.</p>
                                <Link to="/shop" className="bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2">
                                    {t('cart.start_shopping')}
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </Link>
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="flex gap-4 p-4 rounded-lg bg-background-light dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group relative">
                                    <div className="w-24 h-24 flex-shrink-0 bg-white dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img className="w-full h-full object-cover" src={item.image} alt={item.name} />
                                    </div>
                                    <div className="flex-grow flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Link to={`/product/${item.id}`} className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors">{item.name}</Link>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.category}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-bold text-lg text-slate-900 dark:text-white">{formatPrice(item.price)}</span>
                                                <button 
                                                    onClick={() => handleRemoveItem(item.id, item.name)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    title="Remove Item"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                                                <button 
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="px-3 py-1 hover:text-primary transition-colors text-slate-500 font-bold"
                                                > - </button>
                                                <span className="px-2 text-sm font-semibold text-slate-900 dark:text-white min-w-[20px] text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="px-3 py-1 hover:text-primary transition-colors text-slate-500 font-bold"
                                                > + </button>
                                            </div>
                                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <div className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                   {/* ... Summary details ... */}
                   <div className="p-6 space-y-4">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>{t('cart.subtotal')}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{formatPrice(cartTotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>{t('cart.shipping')}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{shipping === 0 ? t('product.free_shipping') : formatPrice(shipping)}</span>
                        </div>
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-4"></div>
                        <div className="flex justify-between items-end">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{t('cart.total')}</span>
                        <span className="text-2xl font-extrabold text-primary">{formatPrice(total)}</span>
                        </div>
                    </div>
                   <div className="p-6 bg-slate-50 dark:bg-slate-800/30">
                     <button 
                         onClick={() => setIsPaymentModalOpen(true)}
                         disabled={items.length === 0}
                         className="w-full bg-primary hover:bg-yellow-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex justify-center items-center gap-2 text-lg"
                     >
                       {t('cart.proceed')}
                       <span className="material-symbols-outlined">arrow_forward</span>
                     </button>
                   </div>
                </div>
              </div>
            </div>
        </div>
        <PaymentModal />
    </div>
  );
};

export default Cart;
