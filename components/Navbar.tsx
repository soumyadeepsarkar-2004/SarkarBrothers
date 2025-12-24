
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { Product } from '../types';
import { formatPrice } from '../utils/formatters';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, addToCart } = useCart();
  const { language, setLanguage, t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsSearchFocused(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
        try {
            const results = await api.products.list({ search: query });
            setSuggestions(results.slice(0, 5)); // Top 5 results
        } catch (e) {
            console.error("Search error", e);
        }
    } else {
        setSuggestions([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSuggestionClick = (productId: string) => {
      navigate(`/product/${productId}`);
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
      setSearchQuery('');
  };
  
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
    setAddedToCart(product.id);
    setTimeout(() => {
        setAddedToCart(null);
    }, 2000);
  };

  // Dropdown Render Logic
  const renderSuggestions = () => {
      if (!isSearchFocused || !searchQuery.trim()) return null;

      return (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1f1b13] rounded-xl shadow-2xl border border-[#f5f3f0] dark:border-[#332f20] overflow-hidden z-[100] animate-[fadeIn_0.1s_ease-out]">
              {suggestions.length > 0 ? (
                  <>
                    <div className="py-2">
                        <div className="px-4 py-2 text-[10px] font-bold text-[#8a8060] uppercase tracking-wider flex justify-between">
                            <span>Products</span>
                            <span>{suggestions.length} matches</span>
                        </div>
                        {suggestions.map(product => (
                            <div 
                                key={product.id} 
                                onClick={() => handleSuggestionClick(product.id)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f3f0] dark:hover:bg-[#2a261a] transition-colors group cursor-pointer"
                            >
                                <div className="size-12 rounded-lg bg-white dark:bg-[#2a261a] overflow-hidden shrink-0 border border-[#e6e3db] dark:border-[#332f20]">
                                    <img src={product.image} alt={product.name} className="size-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm text-[#181611] dark:text-white truncate group-hover:text-primary transition-colors">{product.name}</h4>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-primary text-[14px] fill-current">star</span>
                                        <span className="text-xs font-bold text-[#181611] dark:text-white">{product.rating}</span>
                                        <span className="text-xs text-gray-400">({product.reviews} reviews)</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-primary">{formatPrice(product.price)}</span>
                                    <button
                                        onClick={(e) => handleAddToCart(e, product)}
                                        className={`size-9 rounded-lg transition-all flex items-center justify-center ${addedToCart === product.id ? 'bg-green-500 text-white' : 'bg-primary/10 hover:bg-primary text-primary hover:text-black'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{addedToCart === product.id ? 'check' : 'add_shopping_cart'}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-[#f5f3f0] dark:border-[#332f20] bg-gray-50 dark:bg-[#2a261a]">
                        <button 
                            onClick={handleSearchSubmit}
                            className="w-full py-3 text-center text-sm font-bold text-[#181611] dark:text-white hover:text-primary transition-colors flex items-center justify-center gap-1"
                        >
                            View all results for "{searchQuery}"
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                  </>
              ) : (
                  <div className="p-6 text-center">
                      <span className="material-symbols-outlined text-gray-300 text-3xl mb-1">search_off</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No products found for "<span className="font-bold text-[#181611] dark:text-white">{searchQuery}</span>"</p>
                  </div>
              )}
          </div>
      );
  };

  return (
    <>
    <div className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#221e10]/90 backdrop-blur-md border-b border-[#f5f3f0] dark:border-[#3a3629]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden flex items-center justify-center size-10 rounded-lg hover:bg-[#f5f3f0] dark:hover:bg-[#332e22] transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="size-8 text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>toys</span>
            </div>
            <h2 className="text-[#181611] dark:text-white text-xl font-bold tracking-tight hidden sm:block">ToyWonder</h2>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4 relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8a8060]">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border-none rounded-lg bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#332e22] transition-colors sm:text-sm" 
                placeholder={t('nav.search_placeholder')}
              />
            </form>
            {/* Desktop Suggestions Dropdown */}
            {renderSuggestions()}
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex gap-6 items-center">
              <Link to="/shop" className={`text-sm font-medium transition-colors ${location.pathname === '/shop' ? 'text-primary' : 'hover:text-primary'}`}>{t('nav.shop')}</Link>
              <Link to="/ai-assistant" className={`text-sm font-medium transition-colors ${location.pathname === '/ai-assistant' ? 'text-primary' : 'hover:text-primary'}`}>{t('nav.giftbot')}</Link>
              <Link to="/whatsapp-order" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.order_whatsapp')}</Link>
              <Link to="/admin" className={`text-sm font-medium transition-colors hover:text-primary`}>Admin</Link>
          </nav>

          {/* Right Actions */}
          <div className="flex gap-2 items-center">
             {/* Mobile Search Toggle */}
             <button 
                className="lg:hidden flex items-center justify-center size-10 rounded-lg hover:bg-[#f5f3f0] dark:hover:bg-[#332e22] transition-colors"
                onClick={() => {
                    setIsMobileSearchOpen(!isMobileSearchOpen);
                    // Add slight delay to focus for mobile keyboard
                    if (!isMobileSearchOpen) setTimeout(() => setIsSearchFocused(true), 100);
                }}
             >
               <span className="material-symbols-outlined">search</span>
             </button>

            {/* Language Switcher */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="flex items-center justify-center h-8 px-2 rounded-lg bg-[#f5f3f0] dark:bg-[#332e22] text-xs font-bold text-[#181611] dark:text-white hover:bg-primary/20 transition-colors mr-1"
            >
              {language === 'en' ? 'EN' : 'BN'}
            </button>

            <Link to="/cart" className="flex items-center justify-center size-10 rounded-lg hover:bg-[#f5f3f0] dark:hover:bg-[#332e22] transition-colors relative">
              <span className="material-symbols-outlined">shopping_cart</span>
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center bg-red-500 text-[10px] font-bold text-white rounded-full">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
            <Link to="/profile" className="flex items-center justify-center size-10 rounded-lg hover:bg-[#f5f3f0] dark:hover:bg-[#332e22] transition-colors">
              <span className="material-symbols-outlined">person</span>
            </Link>
          </div>
        </header>

        {/* Mobile Search Bar (Expandable) */}
        {isMobileSearchOpen && (
            <div className="lg:hidden pb-4 animate-[fadeIn_0.2s_ease-out] relative">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onChange={handleSearchChange}
                        autoFocus
                        className="block w-full pl-4 pr-10 py-3 border-none rounded-xl bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-2 focus:ring-primary shadow-inner" 
                        placeholder={t('nav.search_placeholder')}
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary">
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </form>
                {/* Mobile Suggestions Dropdown */}
                {renderSuggestions()}
            </div>
        )}
      </div>
    </div>

    {/* Mobile Drawer Overlay */}
    {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            
            {/* Drawer */}
            <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-[#221e10] shadow-2xl p-6 flex flex-col gap-6 animate-[slideInLeft_0.3s_ease-out]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-3xl fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>toys</span>
                        <span className="text-xl font-bold text-[#181611] dark:text-white">ToyWonder</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex flex-col gap-2">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f5f3f0] dark:hover:bg-[#2a261a] text-[#181611] dark:text-white font-bold transition-colors">
                        <span className="material-symbols-outlined text-gray-400">home</span>
                        Home
                    </Link>
                    <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f5f3f0] dark:hover:bg-[#2a261a] text-[#181611] dark:text-white font-bold transition-colors">
                        <span className="material-symbols-outlined text-gray-400">storefront</span>
                        {t('nav.shop')}
                    </Link>
                    <Link to="/ai-assistant" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f5f3f0] dark:hover:bg-[#2a261a] text-[#181611] dark:text-white font-bold transition-colors">
                        <span className="material-symbols-outlined text-gray-400">smart_toy</span>
                        {t('nav.giftbot')}
                    </Link>
                    <Link to="/whatsapp-order" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f5f3f0] dark:hover:bg-[#2a261a] text-[#181611] dark:text-white font-bold transition-colors">
                        <span className="material-symbols-outlined text-gray-400">chat</span>
                        {t('nav.order_whatsapp')}
                    </Link>
                     <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f5f3f0] dark:hover:bg-[#2a261a] text-[#181611] dark:text-white font-bold transition-colors">
                        <span className="material-symbols-outlined text-gray-400">admin_panel_settings</span>
                        Admin
                    </Link>
                </nav>

                <div className="mt-auto p-4 bg-[#f8f8f5] dark:bg-[#2a261a] rounded-xl">
                    <p className="text-xs text-[#8a8060] mb-2 font-bold uppercase">Customer Support</p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="material-symbols-outlined text-green-500">call</span>
                        +91 98765 43210
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default Navbar;