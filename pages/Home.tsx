
import React from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/formatters';

const Home: React.FC = () => {
  const trendingProducts = products.slice(0, 4);
  const { addToCart } = useCart();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-10 right-[5%] w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-10 animate-[float_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 left-[10%] w-48 h-48 bg-blue-300/20 rounded-full blur-3xl -z-10 animate-[float_5s_ease-in-out_infinite]"></div>
        
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-yellow-700 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">celebration</span>
                {t('home.hero.new_arrival')}
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#181611] dark:text-white leading-[1.1] tracking-tight">
                {t('home.hero.title_1')} <br/>
                <span className="text-primary">{t('home.hero.title_2')}</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/shop" className="h-12 px-8 rounded-lg bg-primary hover:bg-yellow-400 text-[#181611] font-bold text-base shadow-lg shadow-yellow-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
                  {t('home.explore')}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <button className="h-12 px-8 rounded-lg bg-white dark:bg-[#2a261a] border border-gray-200 dark:border-gray-700 hover:border-primary text-[#181611] dark:text-white font-semibold text-base transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                  {t('home.watch_video')}
                </button>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-[600px] lg:max-w-none relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gray-100 dark:bg-gray-800 relative group">
                <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAAAqFXw8ePtjTKTtlAt54AqjdedZGN9pSEt4Xt_Gm1rQTJ3MpR8Ce-_lWwNUoe5EzvkmjiJFcY5Ul1xjzb6xWm2Uqi7VuL7zSkO-tdk6EiRxKmlgA3WftmyhygOUriDZIceq4dy7wctrSuikPE8NAkjQ9JmqS2ME6mqokjm8RU17VqbQ8VDLNhrkAL-Nv_2tkjPzvIYD8TwvVrcMXp29vXTFU9ObvotbShx2vD9TbQYqw1mcvNCdaS1SZ8yxVQTq12ijsGM-_PTcA1")' }}></div>
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Featured</p>
                    <p className="font-bold text-sm">Wooden Building Blocks Set</p>
                  </div>
                  <span className="text-primary font-bold">{formatPrice(2499)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Banner */}
      <section className="py-10 px-4">
        <div className="max-w-[1280px] mx-auto relative overflow-hidden rounded-2xl bg-[#221e10] dark:bg-[#2a261a] text-white p-8 md:p-12 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="bg-primary/20 p-3 rounded-xl shrink-0">
                <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{t('home.ai_banner.title')}</h3>
                <p className="text-gray-300 text-lg">{t('home.ai_banner.text')}</p>
              </div>
            </div>
            <Link to="/ai-assistant" className="shrink-0 bg-white text-[#221e10] hover:bg-gray-100 px-6 py-3 rounded-lg font-bold shadow-md transition-transform active:scale-95 flex items-center gap-2">
              <span className="material-symbols-outlined fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              {t('home.ai_banner.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-12 bg-background-light dark:bg-background-dark">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-8">{t('home.trending')}</h2>
          <div className="flex overflow-x-auto gap-6 pb-8 no-scrollbar snap-x snap-mandatory">
            {trendingProducts.map((product) => (
              <div key={product.id} className="min-w-[260px] md:min-w-[280px] bg-white dark:bg-[#2a261a] rounded-xl shadow-sm hover:shadow-md transition-all snap-start flex flex-col group border border-gray-100 dark:border-gray-800">
                <Link to={`/product/${product.id}`} className="relative aspect-square p-4 block">
                  <div className="w-full h-full bg-center bg-contain bg-no-repeat rounded-lg" style={{ backgroundImage: `url("${product.image}")` }}></div>
                  <button className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black transition-colors text-gray-400 hover:text-red-500">
                    <span className="material-symbols-outlined text-xl">favorite</span>
                  </button>
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">{product.badge}</span>
                  )}
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{product.category}</p>
                  </Link>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      {product.originalPrice && <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>}
                      <span className="font-bold text-lg">{formatPrice(product.price)}</span>
                    </div>
                    <button 
                        onClick={() => addToCart(product)}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-black p-2 rounded-lg transition-colors active:scale-95"
                    >
                      <span className="material-symbols-outlined">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="border-t border-gray-200 dark:border-gray-800 py-12 bg-white dark:bg-[#221e10]">
        <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>
            <h3 className="font-bold text-lg">{t('product.free_shipping')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Free shipping on orders over ₹2000.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
              <span className="material-symbols-outlined text-3xl">redeem</span>
            </div>
            <h3 className="font-bold text-lg">{t('shop.gift_wrapping')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('shop.gift_wrapping_desc')}</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <h3 className="font-bold text-lg">Secure Payment</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">100% secure payment processing.</p>
          </div>
        </div>
      </section>

       {/* Floating AI Button */}
       <div className="fixed bottom-6 right-6 z-50">
        <Link to="/ai-assistant" className="group relative flex size-14 items-center justify-center rounded-full bg-primary text-[#181611] shadow-lg hover:bg-yellow-400 transition-all hover:scale-110">
          <span className="material-symbols-outlined text-[28px]">smart_toy</span>
          <span className="absolute right-full mr-3 bg-white text-[#181611] text-xs font-bold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {t('nav.giftbot')}
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Home;
