
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext'; // Relative import
import { api } from '../services/api';
import { Product } from '../types';
import { formatPrice } from '../utils/formatters';
import LoginModal from './LoginModal'; // Relative import

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, addToCart, items: cartItems } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, user, role } = useAuth(); // Use AuthContext

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false); // New state for mobile search bar overlay
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // State for LoginModal

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null); // Ref for desktop search
  const mobileSearchInputRef = useRef<HTMLInputElement>(null); // Ref for mobile search

  // Helper to highlight search matches
  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const startIndex = lowerText.indexOf(lowerQuery);

    if (startIndex === -1) {
      return <span>{text}</span>;
    }

    const endIndex = startIndex + query.length;
    return (
      <span>
        {text.substring(0, startIndex)}
        <span className="text-primary font-bold">{text.substring(startIndex, endIndex)}</span>
        {text.substring(endIndex)}
      </span>
    );
  };

  // Handle click outside to close dropdown and clear query
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the search container and not on the mobile search toggle button itself
      const isMobileSearchToggleButton = (event.target as HTMLElement).closest('.mobile-search-toggle');

      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node) && !isMobileSearchToggleButton) {
        setIsSearchFocused(false);
        setSearchQuery(''); // Clear search query
        setSuggestions([]); // Clear suggestions
        setIsMobileSearchOpen(false); // Close mobile overlay if open
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus mobile search when it opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  // Focus desktop search when focused state changes
  useEffect(() => {
    if (isSearchFocused && desktopSearchInputRef.current && !isMobileSearchOpen) {
      desktopSearchInputRef.current.focus();
    }
  }, [isSearchFocused, isMobileSearchOpen]);


  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      try {
        // Fetch product suggestions based on the query
        const results = await api.products.list({ search: query });
        setSuggestions(results.slice(0, 5)); // Limit to top 5 results for dropdown
      } catch (e) {
        console.error("Search error", e);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  // Fix: Changed event type from React.FormEvent to React.SyntheticEvent for broader compatibility
  const handleSearchSubmit = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
      setSearchQuery(''); // Clear search bar after navigating
      setSuggestions([]); // Clear suggestions after navigating
    }
  }, [searchQuery, navigate]);

  const handleSuggestionClick = useCallback((productId: string) => {
    navigate(`/product/${productId}`);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setSearchQuery(''); // Clear search bar after selecting
    setSuggestions([]); // Clear suggestions after selecting
  }, [navigate]);

  // NEW: Direct navigation handler for the navigation button
  const handleDirectNavigation = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // Prevent row click
    navigate(`/product/${productId}`);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent dropdown from closing or navigating
    addToCart(product);
    setAddedToCart(product.id);
    setTimeout(() => {
      setAddedToCart(null);
    }, 2000);
  };

  // NEW: Helper to get cart quantity for a product
  const getCartQuantity = (productId: string): number => {
    const cartItem = cartItems.find(item => item.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Dropdown Render Logic
  const renderSuggestions = () => {
    // Only render if focused and there's a query or if there are suggestions
    if (!isSearchFocused || (!searchQuery.trim() && suggestions.length === 0)) return null;

    const hasSuggestions = suggestions.length > 0;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1f1b13] rounded-xl shadow-2xl border border-[#f5f3f0] dark:border-[#332f20] overflow-hidden z-[100] animate-[fadeInDown_0.3s_ease-out]">
        {hasSuggestions ? (
          <>
            <div className="py-2">
              <div className="px-4 py-2 text-[10px] font-bold text-[#8a8060] uppercase tracking-wider flex justify-between">
                <span>{t('nav.products')}</span>
                <span>{suggestions.length} {t('nav.matches')}</span>
              </div>
              {suggestions.map(product => {
                const cartQty = getCartQuantity(product.id);
                const isAdding = addedToCart === product.id;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSuggestionClick(product.id)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f3f0] dark:hover:bg-[#2a261a] transition-colors group cursor-pointer"
                  >
                    <div className="size-12 rounded-lg bg-white dark:bg-[#2a261a] overflow-hidden shrink-0 border border-[#e6e3db] dark:border-[#332f20]">
                      <img src={product.image} alt={product.name} className="size-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[#181611] dark:text-white truncate group-hover:text-primary transition-colors">{highlightMatch(product.name, searchQuery)}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-primary text-[14px] fill-current">star</span>
                        <span className="text-xs font-bold text-[#181611] dark:text-white">{product.rating}</span>
                        <span className="text-xs text-gray-400">({product.reviews} {t('nav.reviews')})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-sm text-primary whitespace-nowrap">{formatPrice(product.price)}</span>

                      {/* Add to Cart Button with Quantity Display */}
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`relative size-9 rounded-lg transition-all flex items-center justify-center shrink-0 ${isAdding
                            ? 'bg-green-500 text-white'
                            : cartQty > 0
                              ? 'bg-primary text-black'
                              : 'bg-primary/10 hover:bg-primary text-primary hover:text-black'
                          }`}
                        aria-label={isAdding ? t('product.added_to_cart_aria') : t('product.add_to_cart_aria')}
                        title={cartQty > 0 ? `In cart: ${cartQty}` : 'Add to cart'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isAdding ? 'check' : cartQty > 0 ? 'shopping_cart' : 'add_shopping_cart'}
                        </span>
                        {cartQty > 0 && !isAdding && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full size-4 flex items-center justify-center">
                            {cartQty > 9 ? '9+' : cartQty}
                          </span>
                        )}
                      </button>

                      {/* Direct Navigation Button */}
                      <button
                        onClick={(e) => handleDirectNavigation(e, product.id)}
                        className="size-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all flex items-center justify-center shrink-0"
                        aria-label="View product details"
                        title="View details"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* View All Results Link */}
            <div className="border-t border-[#f5f3f0] dark:border-[#332f20] bg-gray-50 dark:bg-[#2a261a]">
              <button
                onClick={handleSearchSubmit}
                className="w-full py-3 text-center text-sm font-bold text-[#181611] dark:text-white hover:text-primary transition-colors flex items-center justify-center gap-1"
                aria-label={t('nav.view_all_results_aria', { query: searchQuery })}
              >
                {t('nav.view_all_results')} "{searchQuery}"
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </>
        ) : (
          // No products found message
          <div className="p-6 text-center">
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-3xl mb-1">search_off</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('nav.no_products_found')} "<span className="font-bold text-[#181611] dark:text-white">{searchQuery}</span>"</p>
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
              aria-label={t('nav.open_mobile_menu')}
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
                  ref={desktopSearchInputRef} // Assign ref for desktop search
                  className="block w-full pl-10 pr-3 py-2 border-none rounded-lg bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#332e22] transition-colors duration-300 sm:text-sm"
                  placeholder={t('nav.search_placeholder')}
                  aria-label={t('nav.search_placeholder')}
                />
              </form>
              {/* Desktop Suggestions Dropdown */}
              {renderSuggestions()}
            </div>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden lg:flex gap-6 items-center">
              <Link to="/shop" className={`text-sm font-medium transition-colors ${location.pathname === '/shop' ? 'text-primary' : 'hover:text-primary'}`}>{t('nav.shop')}</Link>
              <Link to="/ai-assistant" className={`text-sm font-medium transition-colors ${location.pathname === '/ai-assistant' ? 'text-primary' : 'hover:text-primary'}`}>{t('nav.giftbot')}</Link>
              <Link to="/voice-assistant" className={`text-sm font-medium transition-colors ${location.pathname === '/voice-assistant' ? 'text-primary' : 'hover:text-primary'}`}>Voice AI</Link>
              <Link to="/image-generator" className={`text-sm font-medium transition-colors ${location.pathname === '/image-generator' ? 'text-primary' : 'hover:text-primary'}`}>Image Generator</Link>
              <Link to="/whatsapp-order" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.order_whatsapp')}</Link>
              {isAuthenticated && ( // Conditionally render Profile link
                <Link to="/profile" className={`text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'text-primary' : 'hover:text-primary'}`}>{t('nav.profile')}</Link>
              )}
              {isAuthenticated && role === 'admin' && ( // Conditionally render Admin link
                <Link to="/admin" className={`text-sm font-medium transition-colors hover:text-primary`}>Admin</Link>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex gap-2 items-center">
              {/* Mobile Search Toggle - Enhanced visibility */}
              <button
                className="lg:hidden flex items-center justify-center size-10 rounded-lg transition-all mobile-search-toggle bg-primary/10 hover:bg-primary/20 text-primary" // Enhanced styling
                onClick={() => {
                  setIsMobileSearchOpen(!isMobileSearchOpen);
                  setIsSearchFocused(true); // Ensure search is focused when opened
                }}
                aria-label={t('nav.toggle_mobile_search')}
              >
                <span className="material-symbols-outlined">search</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="flex items-center justify-center h-8 px-2 rounded-lg bg-[#f5f3f0] dark:bg-[#332e22] text-xs font-bold text-[#181611] dark:text-white hover:bg-primary/20 transition-colors mr-1"
                aria-label={t('nav.switch_language')}
              >
                {language === 'en' ? 'EN' : 'BN'}
              </button>

              {/* Login / Profile Button */}
              {isAuthenticated ? (
                <Link to="/profile" className="flex items-center gap-2 rounded-lg hover:bg-[#f5f3f0] dark:hover:bg-[#332e22] transition-colors p-2" aria-label={t('nav.view_profile_aria', { name: user?.name || 'User' })}>
                  <img src={user?.avatar} alt={user?.name} className="size-8 rounded-full object-cover" />
                  <span className="hidden sm:inline text-sm font-medium text-[#181611] dark:text-white">{user?.name}</span>
                </Link>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
                  aria-label={t('nav.login_or_profile')}
                >
                  <span className="material-symbols-outlined text-lg mr-2">login</span>
                  {t('nav.profile')} {/* "Profile" here acts as "Login/Profile" */}
                </button>
              )}

              <Link to="/cart" className="flex items-center justify-center size-10 rounded-lg hover:bg-[#f5f3f0] dark:hover:bg-[#332e22] transition-colors relative" aria-label={t('nav.view_cart_aria', { count: totalItems })}>
                <span className="material-symbols-outlined">shopping_cart</span>
                {totalItems > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center bg-red-500 text-[10px] font-bold text-white rounded-full">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </header>
        </div>

        {/* Mobile Search Overlay with Backdrop */}
        {isMobileSearchOpen && (
          <>
            {/* Backdrop */}
            <div
              className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setIsSearchFocused(false);
                setSearchQuery('');
                setSuggestions([]);
              }}
            ></div>

            {/* Overlay Content */}
            <div className="lg:hidden fixed inset-0 z-[70] bg-white dark:bg-[#221e10] flex flex-col pt-4 animate-[slideInUp_0.3s_ease-out]">
              <div className="flex items-center gap-3 px-4 pb-4 border-b border-[#f5f3f0] dark:border-[#3a3629]">
                <button
                  className="flex items-center justify-center size-10 rounded-lg hover:bg-[#f5f3f0] dark:hover:bg-[#332e22] transition-colors"
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setIsSearchFocused(false);
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  aria-label={t('nav.close_mobile_search')}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8a8060]">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)} // Keep focus active while in overlay
                    ref={mobileSearchInputRef}
                    className="block w-full pl-10 pr-3 py-2 border-none rounded-lg bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-[#332e22] transition-colors duration-300 sm:text-sm"
                    placeholder={t('nav.search_placeholder')}
                    aria-label={t('nav.search_placeholder')}
                  />
                </form>
              </div>
              <div className="flex-1 overflow-y-auto relative py-2" ref={searchContainerRef}> {/* Use searchContainerRef for click outside logic */}
                {renderSuggestions()}
              </div>
            </div>
          </>
        )}

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-[#221e10] shadow-lg z-50 animate-[slideInLeft_0.3s_ease-out] flex flex-col">
              <div className="flex items-center justify-between h-16 sm:h-20 px-4 border-b border-[#f5f3f0] dark:border-[#3a3629]">
                <Link to="/" className="flex items-center gap-2">
                  <div className="size-8 text-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>toys</span>
                  </div>
                  <h2 className="text-[#181611] dark:text-white text-xl font-bold tracking-tight">ToyWonder</h2>
                </Link>
                <button
                  className="flex items-center justify-center size-10 rounded-lg hover:bg-[#f5f3f0] dark:hover:bg-[#332e22] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label={t('nav.close_mobile_menu')}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === '/shop' ? 'bg-primary/20 text-primary' : 'hover:bg-[#f5f3f0] dark:hover:bg-[#332e22]'}`}>{t('nav.shop')}</Link>
                <Link to="/ai-assistant" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === '/ai-assistant' ? 'text-primary' : 'hover:bg-[#f5f3f0] dark:hover:bg-[#332e22]'}`}>{t('nav.giftbot')}</Link>
                <Link to="/voice-assistant" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === '/voice-assistant' ? 'text-primary' : 'hover:bg-[#f5f3f0] dark:hover:bg-[#332e22]'}`}>Voice AI</Link>
                <Link to="/image-generator" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === '/image-generator' ? 'text-primary' : 'hover:bg-[#f5f3f0] dark:hover:bg-[#332e22]'}`}>Image Generator</Link>
                <Link to="/whatsapp-order" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-lg font-medium hover:bg-[#f5f3f0] dark:hover:bg-[#332e22] transition-colors">{t('nav.order_whatsapp')}</Link>
                {isAuthenticated && (
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === '/profile' ? 'bg-primary/20 text-primary' : 'hover:bg-[#f5f3f0] dark:hover:bg-[#332e22]'}`}>{t('nav.profile')}</Link>
                )}
                {isAuthenticated && role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg font-medium transition-colors hover:bg-[#f5f3f0] dark:hover:bg-[#332e22]'}`}>Admin</Link>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};

export default Navbar;
