
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Nav
    'nav.shop': 'Shop',
    'nav.giftbot': 'GiftBot',
    'nav.order_whatsapp': 'Order via WhatsApp',
    'nav.search_placeholder': 'Search for toys, brands, or gifts...',
    'nav.profile': 'Profile',
    'nav.products': 'Products',
    'nav.reviews': 'reviews',
    'nav.matches': 'matches',
    'nav.no_products_found': 'No products found for',
    'nav.view_all_results': 'View all results for',
    'nav.open_mobile_menu': 'Open mobile menu',
    'nav.toggle_mobile_search': 'Toggle mobile search',
    'nav.close_mobile_search': 'Close mobile search',
    'nav.switch_language': 'Switch language',
    'nav.login_or_profile': 'Login or view profile',
    'nav.view_profile_aria': 'View profile for {name}',
    'nav.view_cart_aria': 'View cart with {count} items',
    'nav.view_all_results_aria': 'View all search results for {query}',
    
    // Home
    'home.hero.new_arrival': 'New Season Arrivals',
    'home.hero.title_1': 'Unwrap the',
    'home.hero.title_2': 'Magic of Play',
    'home.hero.subtitle': 'Curated toys and gifts for every age. From educational wonders to cuddly plushies, discover the perfect present today.',
    'home.explore': 'Explore Collection',
    'home.watch_video': 'Watch Video',
    'home.ai_banner.title': 'Not sure what to gift? Ask our AI Elf!',
    'home.ai_banner.text': 'Our smart assistant can recommend the perfect toy based on age, interests, and budget.',
    'home.ai_banner.cta': 'Chat with Elf',
    'home.trending': 'Trending Now',
    
    // Shop
    'shop.filters': 'Filters',
    'shop.reset': 'Reset All',
    'shop.categories': 'Categories',
    'shop.price_range': 'Price Range',
    'shop.gift_wrapping': 'Gift Wrapping',
    'shop.gift_wrapping_desc': 'Add a special touch with our premium gift wrapping service.',
    'shop.search_results': 'Search Results for',
    'shop.all_toys': 'All Toys',
    'shop.no_results': 'No toys found',
    'shop.no_results_desc': 'Try adjusting your filters or search query.',
    
    // Product
    'product.add_to_cart': 'Add to Cart',
    'product.added': 'Added!',
    'product.quantity': 'Quantity',
    'product.reviews': 'Customer Reviews',
    'product.specs': 'Technical Specifications',
    'product.free_shipping': 'Free Shipping',
    'product.warranty': '1 Year Warranty',
    'product.returns': 'Easy Returns',
    'product.add_to_cart_aria': 'Add product to cart',
    'product.added_to_cart_aria': 'Product added to cart',

    // Cart
    'cart.title': 'Your Selection',
    'cart.empty': 'Your cart is empty.',
    'cart.start_shopping': 'Start Shopping',
    'cart.shipping_form': 'Where should we send the fun?',
    'cart.summary': 'Order Summary',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping Estimate',
    'cart.total': 'Total',
    'cart.proceed': 'Proceed to Payment',
    'cart.whatsapp_promo': 'In a hurry?',
    'cart.whatsapp_link': 'Order via WhatsApp directly →',

    // Profile
    'profile.tab.active': 'Active Orders',
    'profile.tab.past': 'Past Orders',
    'profile.tab.wishlist': 'Wishlist',
    'profile.tab.profile': 'My Profile',
    'profile.tab.addresses': 'Addresses',
    'profile.logout': 'Logout',
    'profile.my_wishlist': 'My Wishlist',
    'profile.wishlist_empty': 'Your wishlist is empty.',

    // AI
    'ai.intro': "Hi there! 👋 I'm GiftBot. I can help you find the perfect toy or gift. Who are we shopping for today?",
    'ai.input_placeholder': 'Type your message...',
    'ai.suggested.gift': '🎁 Gift for 5 year old',
    'ai.suggested.edu': '📚 Educational toys under ₹1000',
    'ai.suggested.rc': '🏎️ Remote control cars',
    'ai.suggested.plush': '🧸 Plushies for toddlers',
    'ai.suggested.art': '🎨 Arts & Crafts ideas',
    'ai.you_might_like': 'You might also like',
    'ai.matches': 'Here are the best matches for that:',
    'ai.error': "I'm having a little trouble connecting to my brain right now.",

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.default': 'Default',
  },
  bn: {
    // Nav
    'nav.shop': 'দোকান',
    'nav.giftbot': 'গিফটবট',
    'nav.order_whatsapp': 'হোয়াটসঅ্যাপে অর্ডার',
    'nav.search_placeholder': 'খেলনা, ব্র্যান্ড বা উপহার খুঁজুন...',
    'nav.profile': 'প্রোফাইল',
    'nav.products': 'পণ্যসমূহ',
    'nav.reviews': 'পর্যালোচনা',
    'nav.matches': 'ম্যাচ',
    'nav.no_products_found': 'কোনো পণ্য পাওয়া যায়নি',
    'nav.view_all_results': 'সমস্ত ফলাফল দেখুন',
    'nav.open_mobile_menu': 'মোবাইল মেনু খুলুন',
    'nav.toggle_mobile_search': 'মোবাইল অনুসন্ধান টগল করুন',
    'nav.close_mobile_search': 'মোবাইল অনুসন্ধান বন্ধ করুন',
    'nav.switch_language': 'ভাষা পরিবর্তন করুন',
    'nav.login_or_profile': 'লগইন বা প্রোফাইল দেখুন',
    'nav.view_profile_aria': '{name} এর প্রোফাইল দেখুন',
    'nav.view_cart_aria': '{count} টি আইটেম সহ কার্ট দেখুন',
    'nav.view_all_results_aria': '{query} এর জন্য সমস্ত অনুসন্ধান ফলাফল দেখুন',

    // Home
    'home.hero.new_arrival': 'নতুন কালেকশন',
    'home.hero.title_1': 'উন্মোচন করুন',
    'home.hero.title_2': 'খেলার জাদু',
    'home.hero.subtitle': 'সব বয়সের জন্য সেরা খেলনা এবং উপহার। শিক্ষামূলক খেলনা থেকে শুরু করে নরম পুতুল, আজই সেরা উপহারটি বেছে নিন।',
    'home.explore': 'সংগ্রহ দেখুন',
    'home.watch_video': 'ভিডিও দেখুন',
    'home.ai_banner.title': 'কি উপহার দেবেন ভাবছেন? আমাদের AI এলফকে জিজ্ঞাসা করুন!',
    'home.ai_banner.text': 'বয়স, আগ্রহ এবং বাজেটের উপর ভিত্তি করে আমাদের স্মার্ট অ্যাসিস্ট্যান্ট আপনাকে সেরা খেলনা খুঁজে পেতে সাহায্য করবে।',
    'home.ai_banner.cta': 'এলফের সাথে কথা বলুন',
    'home.trending': 'জনপ্রিয় খেলনা',
    
    // Shop
    'shop.filters': 'ফিল্টার',
    'shop.reset': 'রিসেট',
    'shop.categories': 'বিভাগ',
    'shop.price_range': 'মূল্য সীমা',
    'shop.gift_wrapping': 'গিফট র‍্যাপিং',
    'shop.gift_wrapping_desc': 'আমাদের প্রিমিয়াম গিফট র‍্যাপিং পরিষেবার মাধ্যমে উপহারটিকে আরও বিশেষ করে তুলুন।',
    'shop.search_results': 'অনুসন্ধান ফলাফল:',
    'shop.all_toys': 'সব খেলনা',
    'shop.no_results': 'কোন খেলনা পাওয়া যায়নি',
    'shop.no_results_desc': 'অনুগ্রহ করে ফিল্টার পরিবর্তন করুন বা অন্য কিছু খুঁজুন।',
    
    // Product
    'product.add_to_cart': 'কার্টে যোগ করুন',
    'product.added': 'যোগ করা হয়েছে!',
    'product.quantity': 'পরিমাণ',
    'product.reviews': 'গ্রাহক পর্যালোচনা',
    'product.specs': 'প্রযুক্তিগত বৈশিষ্ট্য',
    'product.free_shipping': 'ফ্রি শিপিং',
    'product.warranty': '১ বছরের ওয়ারেন্টি',
    'product.returns': 'সহজ রিটার্ন',
    'product.add_to_cart_aria': 'পণ্য কার্টে যোগ করুন',
    'product.added_to_cart_aria': 'পণ্য কার্টে যোগ করা হয়েছে',

    // Cart
    'cart.title': 'আপনার ঝুড়ি',
    'cart.empty': 'আপনার ঝুড়ি খালি।',
    'cart.start_shopping': 'কেনাকাটা শুরু করুন',
    'cart.shipping_form': 'আমরা কোথায় পাঠাব?',
    'cart.summary': 'অর্ডার সারাংশ',
    'cart.subtotal': 'সাবটোটাল',
    'cart.shipping': 'শিপিং খরচ',
    'cart.total': 'মোট',
    'cart.proceed': 'পেমেন্ট করুন',
    'cart.whatsapp_promo': 'তাড়া আছে?',
    'cart.whatsapp_link': 'সরাসরি হোয়াটসঅ্যাপে অর্ডার করুন →',

    // Profile
    'profile.tab.active': 'সক্রিয় অর্ডার',
    'profile.tab.past': 'পূর্ববর্তী অর্ডার',
    'profile.tab.wishlist': 'উইশলিস্ট',
    'profile.tab.profile': 'আমার প্রোফাইল',
    'profile.tab.addresses': 'ঠিকানা',
    'profile.logout': 'লগআউট',
    'profile.my_wishlist': 'আমার উইশলিস্ট',
    'profile.wishlist_empty': 'আপনার উইশলিস্ট খালি।',

    // AI
    'ai.intro': "নমস্কার! 👋 আমি গিফটবট। আমি আপনাকে সেরা খেলনা বা উপহার খুঁজে পেতে সাহায্য করতে পারি। আজ আমরা কার জন্য কেনাকাটা করছি?",
    'ai.input_placeholder': 'আপনার বার্তা লিখুন...',
    'ai.suggested.gift': '🎁 ৫ বছরের শিশুর উপহার',
    'ai.suggested.edu': '📚 ১০০০ টাকার নিচে শিক্ষামূলক খেলনা',
    'ai.suggested.rc': '🏎️ রিমোট কন্ট্রোল গাড়ি',
    'ai.suggested.plush': '🧸 বাচ্চাদের জন্য পুতুল',
    'ai.suggested.art': '🎨 আর্ট এবং ক্রাফট আইডিয়া',
    'ai.you_might_like': 'আপনার পছন্দ হতে পারে',
    'ai.matches': 'এখানে কিছু সেরা বিকল্প রয়েছে:',
    'ai.error': "আমার সংযোগে একটু সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।",

    // Common
    'common.save': 'সংরক্ষণ',
    'common.cancel': 'বাতিল',
    'common.edit': 'সম্পাদনা',
    'common.delete': 'মুছুন',
    'common.default': 'ডিফল্ট',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    // @ts-ignore
    let translation = translations[language][key] || key;
    if (replacements) {
      for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
      }
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
