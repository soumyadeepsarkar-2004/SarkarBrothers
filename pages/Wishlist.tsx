
import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { products } from '../data';
import { formatPrice } from '../utils/formatters';
import LazyImage from '../components/LazyImage';

const Wishlist: React.FC = () => {
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  const handleAddToCartAndRemove = (product: typeof products[0]) => {
    addToCart(product);
    toggleWishlist(product.id);
  };

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#181611] dark:text-white">
            My Wishlist
          </h1>
          <p className="text-sm text-[#8a8060] mt-1">
            {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        {wishlistProducts.length > 0 && (
          <button
            onClick={() => wishlistProducts.forEach(p => toggleWishlist(p.id))}
            className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">delete_sweep</span>
            Clear All
          </button>
        )}
      </div>

      {/* Empty State */}
      {wishlistProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-24 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-red-400 text-5xl">favorite</span>
          </div>
          <h2 className="text-2xl font-bold text-[#181611] dark:text-white mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-[#8a8060] max-w-md mb-8">
            Start adding items you love by tapping the heart icon on any product. They'll show up here so you can find them easily later!
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-primary hover:bg-yellow-400 text-[#181611] font-bold px-8 py-3 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined">storefront</span>
            Browse Shop
          </Link>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistProducts.map(product => (
              <div
                key={product.id}
                className="group bg-white dark:bg-[#1a170e] border border-[#f5f3f0] dark:border-[#332f25] rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col relative"
              >
                {/* Remove from wishlist */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <span
                    className="material-symbols-outlined text-[20px] fill-current"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                </button>

                {/* Image */}
                <Link to={`/product/${product.id}`} className="relative aspect-square bg-[#f8f8f8] dark:bg-[#252525] overflow-hidden block">
                  {product.badge && (
                    <div className="absolute top-3 left-3 z-10 bg-primary text-[#181611] text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider">
                      {product.badge}
                    </div>
                  )}
                  <LazyImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <Link to={`/product/${product.id}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="material-symbols-outlined text-primary text-[16px] fill-current">star</span>
                      <span className="text-xs font-bold text-[#181611] dark:text-white">{product.rating || '--'}</span>
                      <span className="text-xs text-gray-400">({product.reviews})</span>
                    </div>
                    <h3 className="font-bold text-lg text-[#181611] dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{product.category}</p>
                  </Link>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                        <span className="text-lg font-bold text-[#181611] dark:text-white">{formatPrice(product.price)}</span>
                      </div>
                      {product.stock > 0 ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <span className="size-1.5 bg-green-500 rounded-full"></span>
                          In Stock
                        </span>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">Out of Stock</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCartAndRemove(product)}
                      disabled={product.stock === 0}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-2.5 rounded-xl transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                      Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Shopping */}
          <div className="mt-12 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-primary hover:text-yellow-500 font-bold transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Continue Shopping
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Wishlist;
