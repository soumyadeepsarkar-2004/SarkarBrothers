
import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { products } from '../data';
import { formatPrice } from '../utils/formatters';
import LazyImage from '../components/LazyImage';

const Wishlist: React.FC = () => {
    const { wishlist, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { t } = useLanguage();

    const wishlistProducts = products.filter(p => wishlist.includes(p.id));

    const handleAddAllToCart = () => {
        wishlistProducts.forEach(p => addToCart(p));
    };

    return (
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeIn_0.3s_ease-out]">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#8a8060] mb-6">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="font-medium text-[#181611] dark:text-white">Wishlist</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#181611] dark:text-white">
                        <span className="material-symbols-outlined text-red-500 text-3xl align-middle mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        My Wishlist
                    </h1>
                    <p className="text-[#8a8060] mt-1">
                        {wishlistProducts.length === 0
                            ? "You haven't saved any items yet."
                            : `${wishlistProducts.length} item${wishlistProducts.length !== 1 ? 's' : ''} saved`}
                    </p>
                </div>
                {wishlistProducts.length > 0 && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleAddAllToCart}
                            className="bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 text-sm active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                            Add All to Cart
                        </button>
                        <button
                            onClick={() => wishlistProducts.forEach(p => toggleWishlist(p.id))}
                            className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-400 hover:text-red-500 font-medium py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 text-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {wishlistProducts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center size-24 bg-red-50 dark:bg-red-900/20 rounded-full mb-6">
                        <span className="material-symbols-outlined text-red-300 dark:text-red-700 text-6xl">favorite</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#181611] dark:text-white mb-3">Your wishlist is empty</h2>
                    <p className="text-[#8a8060] mb-8 max-w-md mx-auto">
                        Browse our collection and tap the heart icon on products you love to save them here.
                    </p>
                    <Link
                        to="/shop"
                        className="bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">storefront</span>
                        Browse Shop
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlistProducts.map(product => (
                        <div
                            key={product.id}
                            className="group bg-white dark:bg-[#1a170e] border border-[#f5f3f0] dark:border-[#332f25] rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col relative"
                        >
                            {/* Remove from wishlist */}
                            <button
                                onClick={() => toggleWishlist(product.id)}
                                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                title="Remove from wishlist"
                            >
                                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
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
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.category}</p>
                                </Link>

                                {/* Stock */}
                                <p className={`text-xs font-medium mb-3 ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                                    {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
                                </p>

                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex flex-col">
                                        {product.originalPrice && (
                                            <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                                        )}
                                        <span className="text-lg font-bold text-[#181611] dark:text-white">{formatPrice(product.price)}</span>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product)}
                                        disabled={product.stock === 0}
                                        className="bg-primary hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#181611] p-2.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 text-sm font-bold"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
