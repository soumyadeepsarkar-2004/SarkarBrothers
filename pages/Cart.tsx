
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/formatters';
import { Product } from '../types';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, cartTotal, addToCart } = useCart();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Shipping Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    zip: '',
    country: 'India'
  });
  
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Simulate checking stock/prices
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const shipping = cartTotal > 2000 ? 0 : 100;
  const total = cartTotal + shipping;

  // Calculate Delivery Dates
  const today = new Date();
  const startData = new Date(today); startData.setDate(today.getDate() + 3);
  const endData = new Date(today); endData.setDate(today.getDate() + 7);
  const deliveryRange = `${startData.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endData.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const isInvalid = (name: keyof typeof formData) => {
      return touched[name] && !formData[name];
  };

  const getInputClass = (name: keyof typeof formData) => {
      const base = "w-full rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary shadow-sm transition-colors";
      return `${base} ${isInvalid(name) ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'}`;
  };

  const handleRemoveItem = (id: string, name: string) => {
      if (window.confirm(`Are you sure you want to remove "${name}" from your cart?`)) {
          removeFromCart(id);
      }
  };

  const QuickViewModal = () => {
    if (!quickViewProduct) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setQuickViewProduct(null)}>
            <div className="bg-white dark:bg-[#1a170d] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="aspect-square bg-gray-100 dark:bg-[#252525] relative">
                         <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{quickViewProduct.category}</p>
                                <h3 className="text-2xl font-bold text-[#181611] dark:text-white">{quickViewProduct.name}</h3>
                            </div>
                            <button onClick={() => setQuickViewProduct(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                             <span className="text-2xl font-bold text-[#181611] dark:text-white">{formatPrice(quickViewProduct.price)}</span>
                        </div>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                            {quickViewProduct.description || "Quality toy designed for fun and learning."}
                        </p>

                        <div className="mt-auto flex flex-col gap-3">
                            <button 
                                onClick={() => { addToCart(quickViewProduct, 1); setQuickViewProduct(null); }}
                                className="w-full bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">add_shopping_cart</span>
                                {t('product.add_to_cart')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  if (loading) {
      return (
        <div className="flex-grow container mx-auto px-4 py-8 max-w-7xl animate-pulse">
             <div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] w-full mb-10 rounded"></div>
             <div className="flex gap-8">
                 <div className="w-2/3 space-y-4">
                     <div className="h-40 bg-gray-200 dark:bg-[#2a2a2a] rounded-xl"></div>
                     <div className="h-40 bg-gray-200 dark:bg-[#2a2a2a] rounded-xl"></div>
                 </div>
                 <div className="w-1/3">
                    <div className="h-80 bg-gray-200 dark:bg-[#2a2a2a] rounded-xl"></div>
                 </div>
             </div>
        </div>
      );
  }

  return (
    <div className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
      {/* Progress Stepper */}
      <div className="mb-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10"></div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-slate-900 flex items-center justify-center font-bold text-sm ring-4 ring-background-light dark:ring-background-dark">
              <span className="material-symbols-outlined text-base">shopping_bag</span>
            </div>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Cart</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm ring-4 ring-background-light dark:ring-background-dark">
              2
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Shipping</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm ring-4 ring-background-light dark:ring-background-dark">
              3
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Payment</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow lg:w-2/3 space-y-8">
          {/* Cart Items */}
          <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">shopping_basket</span> 
                {t('cart.title')} ({items.length})
              </h2>
            </div>
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
                            {/* Quick View Button */}
                            <button 
                                onClick={() => setQuickViewProduct(item)}
                                className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-black/60 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black text-slate-700 dark:text-white shadow-sm"
                                title="Quick View"
                            >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>

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
                                        >
                                            -
                                        </button>
                                        <span className="px-2 text-sm font-semibold text-slate-900 dark:text-white min-w-[20px] text-center">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="px-3 py-1 hover:text-primary transition-colors text-slate-500 font-bold"
                                        >
                                            +
                                        </button>
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

          {/* Shipping Form */}
          {items.length > 0 && (
          <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary">local_shipping</span> 
                {t('cart.shipping_form')}
            </h2>
            <form className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name <span className="text-red-500">*</span></label>
                        <input 
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getInputClass('firstName')} 
                            type="text" 
                            placeholder="e.g. Alex" 
                        />
                        {isInvalid('firstName') && <p className="text-red-500 text-xs mt-1">First name is required</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name <span className="text-red-500">*</span></label>
                        <input 
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getInputClass('lastName')} 
                            type="text" 
                            placeholder="e.g. Smith" 
                        />
                         {isInvalid('lastName') && <p className="text-red-500 text-xs mt-1">Last name is required</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Street Address <span className="text-red-500">*</span></label>
                    <input 
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={getInputClass('street')}
                        type="text" 
                        placeholder="123 Toy Lane" 
                    />
                     {isInvalid('street') && <p className="text-red-500 text-xs mt-1">Address is required</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City <span className="text-red-500">*</span></label>
                         <input 
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getInputClass('city')} 
                            type="text" 
                         />
                          {isInvalid('city') && <p className="text-red-500 text-xs mt-1">Required</p>}
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Zip Code <span className="text-red-500">*</span></label>
                         <input 
                            name="zip"
                            value={formData.zip}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={getInputClass('zip')} 
                            type="text" 
                         />
                          {isInvalid('zip') && <p className="text-red-500 text-xs mt-1">Required</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Country</label>
                        <select 
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary shadow-sm cursor-pointer"
                        >
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                        </select>
                    </div>
                </div>
            </form>
          </section>
          )}
        </div>

        {/* Sticky Summary */}
        <div className="lg:w-1/3">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('cart.summary')}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t('cart.shipping')}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{shipping === 0 ? t('product.free_shipping') : formatPrice(shipping)}</span>
                </div>
                
                {items.length > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Est. Delivery</span>
                        <span className="font-bold text-green-600">{deliveryRange}</span>
                    </div>
                )}

                <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-4"></div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{t('cart.total')}</span>
                  <span className="text-2xl font-extrabold text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30">
                <button 
                    disabled={items.length === 0}
                    className="w-full bg-primary hover:bg-yellow-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex justify-center items-center gap-2 text-lg"
                >
                  {t('cart.proceed')}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined">chat</span>
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('cart.whatsapp_promo')}</h4>
                <Link to="/whatsapp-order" className="text-xs text-green-600 dark:text-green-400 hover:underline font-semibold">{t('cart.whatsapp_link')}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuickViewModal />
    </div>
  );
};

export default Cart;
