
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getHistory } from '../services/api'; 
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/formatters';
import { Product } from '../types';
import LoadingToy from '../components/LoadingToy';

const PRICE_RANGES = [
  { label: 'Under ₹2000', min: 0, max: 2000 },
  { label: '₹2000 to ₹4000', min: 2000, max: 4000 },
  { label: '₹4000 to ₹8000', min: 4000, max: 8000 },
  { label: 'Over ₹8000', min: 8000, max: Infinity }
];

const Shop: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search'); // Get search param from URL
  
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>('Newest Arrivals');
  // searchTerm is now primarily driven by initialSearch from URL, so no local state management needed for filtering
  
  const [products, setProducts] = useState<Product[]>([]);
  const [generalRecommendations, setGeneralRecommendations] = useState<Product[]>([]); // For non-search recs
  const [aiRecommendations, setAiRecommendations] = useState<Product[]>([]); // For search-based AI recs
  const [loading, setLoading] = useState(true);
  
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t } = useLanguage();

  // Fetch Products via Service
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const priceRanges = priceFilter.map(label => PRICE_RANGES.find(r => r.label === label)).filter(Boolean) as {min:number, max:number}[];
        
        const data = await api.products.list({
          search: initialSearch || undefined, // Use initialSearch from URL
          categories: categoryFilter,
          priceRange: priceRanges,
          sort: sortOption
        });
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [initialSearch, categoryFilter, priceFilter, sortOption]); // Depend on initialSearch

  // Fetch General Recommendations based on History (when no active search)
  useEffect(() => {
      const loadGeneralRecs = async () => {
          if (!initialSearch) { // Only load general recs if no search is active
              const history = getHistory();
              if (history.length > 0) {
                  try {
                      const recs = await api.products.getRecommendations(history);
                      setGeneralRecommendations(recs);
                  } catch (e) {
                      console.error("Failed to load general recommendations", e);
                  }
              }
          } else {
              setGeneralRecommendations([]); // Clear general recs if search is active
          }
      };
      loadGeneralRecs();
  }, [initialSearch]); // Depend on initialSearch

  // Fetch AI-Powered Recommendations based on Search Term
  useEffect(() => {
    const fetchAiRecommendations = async () => {
        if (initialSearch) { // Only fetch AI recs if there's an active search
            try {
                // api.products.getRecommendations uses the AI backend if USE_MOCK_BACKEND is false
                // For mock backend, it does a simple keyword match (as implemented in services/api.ts)
                const recs = await api.products.getRecommendations([initialSearch]); // Use initialSearch as history/context
                setAiRecommendations(recs);
            } catch (error) {
                console.error("Failed to load AI recommendations", error);
                setAiRecommendations([]); // Clear on error
            }
        } else {
            setAiRecommendations([]); // Clear if no search
        }
    };
    fetchAiRecommendations();
}, [initialSearch]); // Re-fetch when the search term changes
  
  return (
    <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-10 py-6">
      {/* Hero Banner */}
      <div className="mb-8 rounded-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10 flex flex-col justify-center px-8 md:px-16 gap-3">
          <span className="inline-block px-3 py-1 rounded-full bg-primary text-xs font-extrabold text-[#181611] uppercase tracking-wide w-fit">Summer Sale</span>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight max-w-xl">
            Unleash Their <br/><span className="text-primary">Imagination</span>
          </h1>
          <p className="text-white/90 text-sm md:text-base max-w-md font-medium">Get up to 20% off on all outdoor toys and creative sets this season.</p>
        </div>
        <img alt="Hero Banner" className="w-full h-[320px] md:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105" src="https://images.unsplash.com/photo-1579624520336-d7e7c8a141d0?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-6 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg dark:text-white">{t('shop.filters')}</h3>
            <button 
                onClick={() => { setCategoryFilter([]); setPriceFilter([]); /* searchTerm is managed by URL, no local state clear needed */ }}
                className="text-xs text-[#8a8060] font-medium hover:text-primary transition-colors"
            >
                {t('shop.reset')}
            </button>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-col gap-3 pb-4 border-b border-[#f5f3f0] dark:border-[#332f25]">
            <button className="flex items-center justify-between w-full group">
              <span className="font-bold text-sm dark:text-white">{t('shop.categories')}</span>
              <span className="material-symbols-outlined text-gray-400 text-lg group-hover:text-primary transition-colors">expand_less</span>
            </button>
            <div className="flex flex-col gap-2 pl-1">
              {['Educational', 'Plushies', 'Outdoor Fun', 'Arts & Crafts', 'Robots', 'Gifts'].map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={categoryFilter.includes(cat)}
                    onChange={() => {
                        if (categoryFilter.includes(cat)) {
                            setCategoryFilter(categoryFilter.filter(c => c !== cat));
                        } else {
                            setCategoryFilter([...categoryFilter, cat]);
                        }
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 bg-gray-50 dark:bg-[#332f25] dark:border-gray-600" 
                  />
                  <span className={`text-sm transition-colors ${categoryFilter.includes(cat) ? 'text-primary font-bold' : 'text-gray-600 dark:text-gray-300 group-hover:text-primary'}`}>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="flex flex-col gap-3 pb-4 border-b border-[#f5f3f0] dark:border-[#332f25]">
            <button className="flex items-center justify-between w-full group">
              <span className="font-bold text-sm dark:text-white">{t('shop.price_range')}</span>
              <span className="material-symbols-outlined text-gray-400 text-lg group-hover:text-primary transition-colors">expand_less</span>
            </button>
            <div className="flex flex-col gap-2 pl-1">
              {PRICE_RANGES.map(range => (
                <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={priceFilter.includes(range.label)}
                    onChange={() => {
                        if (priceFilter.includes(range.label)) {
                            setPriceFilter(priceFilter.filter(p => p !== range.label));
                        } else {
                            setPriceFilter([...priceFilter, range.label]);
                        }
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 bg-gray-50 dark:bg-[#332f25] dark:border-gray-600" 
                  />
                   <span className={`text-sm transition-colors ${priceFilter.includes(range.label) ? 'text-primary font-bold' : 'text-gray-600 dark:text-gray-300 group-hover:text-primary'}`}>{range.label}</span>
                </label>
              ))}
            </div>
          </div>
          
           <div className="mt-auto p-4 rounded-xl bg-[#fefce8] dark:bg-[#2e2a1e] border border-primary/20">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">card_giftcard</span>
              <div>
                <h4 className="font-bold text-sm text-[#181611] dark:text-white">{t('shop.gift_wrapping')}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('shop.gift_wrapping_desc')}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 flex flex-col">
          {/* Previous AI Recommendations Section (now removed from here) */}
          {/* Previous General Recommendations Section (now removed from here) */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white">
                {initialSearch ? `${t('shop.search_results')} "${initialSearch}"` : t('shop.all_toys')}
                <span className="text-base font-normal text-gray-500 ml-2">({products.length} items)</span>
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="appearance-none bg-white dark:bg-[#1a170e] border border-[#f5f3f0] dark:border-[#332f25] rounded-lg py-2 pl-4 pr-10 text-sm font-medium text-[#181611] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                >
                  <option>Newest Arrivals</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Best Sellers</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg">expand_more</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
                 <div className="col-span-full flex justify-center">
                     <LoadingToy />
                 </div>
            ) : (
                products.map((product) => (
                <div key={product.id} className="group bg-white dark:bg-[#1a170e] border border-[#f5f3f0] dark:border-[#332f25] rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col relative">
                    <button 
                        onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
                        className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-colors ${isInWishlist(product.id) ? 'bg-red-50 text-red-500' : 'bg-white/80 dark:bg-black/50 text-gray-400 hover:text-red-500'}`}
                    >
                        <span className={`material-symbols-outlined text-[20px] ${isInWishlist(product.id) ? 'fill-current' : ''}`} style={isInWishlist(product.id) ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                    </button>
                    
                    <Link to={`/product/${product.id}`} className="relative aspect-square bg-[#f8f8f8] dark:bg-[#252525] overflow-hidden block">
                    {product.badge && <div className="absolute top-3 left-3 z-10 bg-primary text-[#181611] text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider">{product.badge}</div>}
                    <img alt="Product" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={product.image} />
                    </Link>
                    <div className="p-4 flex flex-col flex-1">
                    <Link to={`/product/${product.id}`}>
                        <div className="flex items-center gap-1 mb-1">
                            <span className="material-symbols-outlined text-primary text-[16px] fill-current">star</span>
                            <span className="text-xs font-bold text-[#181611] dark:text-white">{product.rating || '--'}</span>
                            <span className="text-xs text-gray-400">({product.reviews})</span>
                        </div>
                        <h3 className="font-bold text-lg text-[#181611] dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{product.category}</p>
                    </Link>
                    <div className="mt-auto flex items-center justify-between">
                        <div className="flex flex-col">
                            {product.originalPrice && <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>}
                            <span className="text-lg font-bold text-[#181611] dark:text-white">{formatPrice(product.price)}</span>
                        </div>
                        <button 
                        onClick={() => addToCart(product)}
                        className="bg-[#f5f3f0] dark:bg-[#332f25] text-[#181611] dark:text-white p-2.5 rounded-lg hover:bg-primary hover:text-black transition-all active:scale-95"
                        >
                        <span className="material-symbols-outlined text-[20px] block">add_shopping_cart</span>
                        </button>
                    </div>
                    </div>
                </div>
                ))
            )}
            {!loading && products.length === 0 && (
                <div className="col-span-full py-20 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-gray-700 mb-4">search_off</span>
                    <h3 className="text-xl font-bold text-[#181611] dark:text-white">{t('shop.no_results')}</h3>
                    <p className="text-gray-500 mt-2">{t('shop.no_results_desc')}</p>
                </div>
            )}
          </div>

          {/* Combined Recommendations Section (Moved to the bottom) */}
          {(aiRecommendations.length > 0 || generalRecommendations.length > 0) && !loading && (
              <div className="mt-12 animate-[fadeIn_0.5s_ease-out]">
                  <h3 className="flex items-center gap-2 text-xl font-bold text-[#181611] dark:text-white mb-6">
                      {initialSearch && aiRecommendations.length > 0 ? (
                        <>
                          <span className="material-symbols-outlined text-blue-500 fill-current">psychology</span>
                          AI-Powered Recommendations for "{initialSearch}"
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-primary fill-current">auto_awesome</span>
                          Picked Just For You
                        </>
                      )}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(initialSearch && aiRecommendations.length > 0 ? aiRecommendations : generalRecommendations).map(p => (
                          <Link key={'rec-'+p.id} to={`/product/${p.id}`} className={`block group rounded-xl overflow-hidden hover:shadow-lg transition-all ${initialSearch ? 'bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/50' : 'bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 hover:border-primary/50'}`}>
                              <div className="aspect-square bg-white dark:bg-[#2a2a2a] relative">
                                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                              <div className="p-3">
                                  <h4 className="font-bold text-sm text-[#181611] dark:text-white truncate">{p.name}</h4>
                                  <p className={`text-xs font-bold ${initialSearch ? 'text-blue-500' : 'text-primary'}`}>{formatPrice(p.price)}</p>
                              </div>
                          </Link>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
