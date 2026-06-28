
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/formatters';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // Relative import
import CheckoutForm from '../components/CheckoutForm';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../services/stripeService';
import type { Stripe } from '@stripe/stripe-js';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, cartTotal, addToCart, clearCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Use AuthContext
  
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    setStripePromise(getStripe());
    return () => clearTimeout(timer);
  }, []);

  const shipping = cartTotal > 499 ? 0 : 100;
  const total = cartTotal + shipping;

  const handleRemoveItem = (id: string, name: string) => {
      if (window.confirm(`Are you sure you want to remove "${name}" from your cart?`)) {
          removeFromCart(id);
      }
  };

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleProceedToPayment = async () => {
    if (!isAuthenticated || !user?.email) {
      alert("Please log in to complete your order.");
      navigate('/profile');
      return;
    }
    
    setPaymentProcessing(true);
    setIsPaymentModalOpen(true);
    try {
        const response = await api.user.createOrder(items, total, user.email);
        
        // The backend returns { order: { ... }, paymentIntent: { clientSecret: '...' } }
        if (response.paymentIntent?.clientSecret) {
            setClientSecret(response.paymentIntent.clientSecret);
            setOrderId(response.order._id || response.order.id);
        } else {
            throw new Error("Missing clientSecret in response");
        }
    } catch (e) {
        console.error("Failed to initialize payment", e);
        setIsPaymentModalOpen(false);
        alert("There was an issue starting your payment. Please try again.");
    } finally {
        setPaymentProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
      clearCart();
      setIsPaymentModalOpen(false);
      navigate('/profile?order_success=true');
  };

  const PaymentModal = () => {
      if (!isPaymentModalOpen) return null;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !clientSecret && setIsPaymentModalOpen(false)}>
            <div className="bg-white dark:bg-[#1f1b13] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out] border-4 border-primary/50" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#181611] dark:text-white">Secure Checkout</h2>
                        <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-red-500">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {paymentProcessing && !clientSecret ? (
                        <div className="flex flex-col items-center py-8 gap-4">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[#8a8060]">Initializing secure payment...</p>
                        </div>
                    ) : clientSecret && orderId && stripePromise ? (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CheckoutForm 
                                clientSecret={clientSecret} 
                                orderId={orderId} 
                                amount={total} 
                                onSuccess={handlePaymentSuccess} 
                            />
                        </Elements>
                    ) : (
                        <div className="text-center text-red-500 py-8">
                            <p>Failed to load payment form.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#8a8060] font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

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
                         onClick={handleProceedToPayment}
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
