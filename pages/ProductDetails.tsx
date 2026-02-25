

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from '../data';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/formatters';
import { saveToHistory } from '../services/api';
import LoadingToy from '../components/LoadingToy';
import LazyImage from '../components/LazyImage';

// Mock reviews data
const MOCK_REVIEWS = [
  { id: 1, user: "Alice M.", rating: 5, date: "2 days ago", comment: "My son absolutely loves this! Great quality and super fast shipping." },
  { id: 2, user: "John D.", rating: 4, date: "1 week ago", comment: "Good toy, exactly as described. The packaging was a bit damaged though." },
  { id: 3, user: "Sarah K.", rating: 5, date: "2 weeks ago", comment: "Perfect gift for a 5-year-old. Highly recommend!" }
];

const ProductDetails: React.FC = () => {
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t } = useLanguage();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    // Save to history for AI recommendations
    if (product) {
      saveToHistory(product.name);
    }

    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [id, product]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const adjustQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-[600px] flex items-center justify-center">
        <LoadingToy />
      </div>
    );
  }

  if (!product) return <div className="p-10 text-center">Product not found</div>;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[#8a8060] mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <Link to="/shop" className="hover:text-primary transition-colors">{t('nav.shop')}</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-medium text-[#181611] dark:text-white">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
        {/* Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white dark:bg-[#332f20] border border-[#e6e3db] dark:border-[#332f20] flex items-center justify-center relative group">
            {product.badge && (
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-bold text-background-dark shadow-sm">{product.badge}</span>
              </div>
            )}
            <LazyImage
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
            />
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-24 flex flex-col gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#181611] dark:text-white md:text-4xl">
                {product.name}
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[20px] fill-current">star</span>
                  ))}
                </div>
                <span className="text-sm font-medium text-[#181611] dark:text-gray-300">{product.rating} ({product.reviews} reviews)</span>
              </div>
            </div>

            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-[#181611] dark:text-white">{formatPrice(product.price)}</p>
              {product.originalPrice && <p className="mb-1 text-lg font-medium text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>}
              {product.originalPrice && <span className="mb-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">Save {Math.round((1 - product.price / product.originalPrice) * 100)}%</span>}
            </div>

            <p className="text-base leading-relaxed text-[#5e584a] dark:text-gray-400">
              {product.description || "Ignite your child's imagination with this amazing toy! Designed for educational fun and durable play."}
            </p>

            <div className="space-y-4 pt-4 border-t border-[#e6e3db] dark:border-[#332f20]">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-[#181611] dark:text-white">{t('product.quantity')}</label>
                <div className="flex items-center rounded-lg border border-[#e6e3db] dark:border-[#443f30]">
                  <button onClick={() => adjustQuantity(-1)} className="px-3 py-1 hover:bg-[#f5f3f0] dark:hover:bg-[#332f20] rounded-l-lg text-[#181611] dark:text-white transition-colors">-</button>
                  <input className="w-12 border-none bg-transparent py-1 text-center text-sm font-medium focus:ring-0 text-[#181611] dark:text-white" readOnly type="text" value={quantity} />
                  <button onClick={() => adjustQuantity(1)} className="px-3 py-1 hover:bg-[#f5f3f0] dark:hover:bg-[#332f20] rounded-r-lg text-[#181611] dark:text-white transition-colors">+</button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold shadow-sm transition-all ${added
                        ? 'bg-green-500 text-white'
                        : 'bg-primary text-background-dark hover:bg-primary/90 hover:shadow-md'
                      }`}
                  >
                    <span className="material-symbols-outlined">{added ? 'check' : 'shopping_bag'}</span>
                    {added ? t('product.added') : t('product.add_to_cart')}
                  </button>
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`px-4 rounded-xl border-2 transition-colors flex items-center justify-center ${isInWishlist(product.id)
                        ? 'border-red-500 bg-red-50 text-red-500'
                        : 'border-[#e6e0d4] dark:border-[#444] text-[#8a8060] hover:border-red-500 hover:text-red-500'
                      }`}
                  >
                    <span className={`material-symbols-outlined ${isInWishlist(product.id) ? 'fill-current' : ''}`} style={isInWishlist(product.id) ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                  </button>
                </div>

                <Link to="/whatsapp-order" className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366] bg-[#25D366]/10 px-8 py-3 text-base font-bold text-[#1e8d47] dark:text-[#25D366] hover:bg-[#25D366]/20 transition-all">
                  <span className="material-symbols-outlined">chat</span>
                  {t('nav.order_whatsapp')}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4">
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="rounded-full bg-[#f5f3f0] dark:bg-[#332f20] p-2 text-[#8a8060]">
                  <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                </div>
                <span className="text-xs font-medium text-[#8a8060]">{t('product.free_shipping')}</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="rounded-full bg-[#f5f3f0] dark:bg-[#332f20] p-2 text-[#8a8060]">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <span className="text-xs font-medium text-[#8a8060]">{t('product.warranty')}</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="rounded-full bg-[#f5f3f0] dark:bg-[#332f20] p-2 text-[#8a8060]">
                  <span className="material-symbols-outlined text-[20px]">package</span>
                </div>
                <span className="text-xs font-medium text-[#8a8060]">{t('product.returns')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specs & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {product.specs && (
          <div className="bg-[#f5f3f0] dark:bg-[#2a261a] rounded-2xl p-8">
            <h3 className="text-xl font-bold text-[#181611] dark:text-white mb-6">{t('product.specs')}</h3>
            <div className="space-y-4">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-[#e6e3db] dark:border-[#332f20] pb-3">
                  <span className="text-[#8a8060] font-medium">{key}</span>
                  <span className="font-bold text-[#181611] dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-[#1a170d] border border-[#e6e3db] dark:border-[#332f20] rounded-2xl p-8">
          <h3 className="text-xl font-bold text-[#181611] dark:text-white mb-6 flex items-center gap-2">
            {t('product.reviews')}
            <span className="text-sm font-normal text-gray-500 bg-[#f5f3f0] dark:bg-[#332f20] px-2 py-1 rounded-full">{product.reviews}</span>
          </h3>

          <div className="space-y-6">
            {MOCK_REVIEWS.map(review => (
              <div key={review.id} className="border-b border-[#f5f3f0] dark:border-[#332f20] last:border-0 pb-6 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {review.user.charAt(0)}
                    </div>
                    <span className="font-bold text-sm text-[#181611] dark:text-white">{review.user}</span>
                  </div>
                  <span className="text-xs text-[#8a8060]">{review.date}</span>
                </div>
                <div className="flex text-primary mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[16px] fill-current" style={i < review.rating ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-[#e6e3db] dark:border-[#332f20] rounded-xl text-sm font-bold text-[#181611] dark:text-white hover:bg-[#f5f3f0] dark:hover:bg-[#332f20] transition-colors">
            Load More Reviews
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;