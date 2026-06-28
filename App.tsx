


import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import AiAssistant from './pages/AiAssistant';
import VoiceAssistant from './pages/VoiceAssistant';
import ImageGenerator from './pages/ImageGenerator';
import WhatsAppOrder from './pages/WhatsAppOrder';
import Admin from './pages/Admin';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';


import ShippingReturns from './pages/ShippingReturns';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Faq from './pages/Faq';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Hide footer on admin page
const ConditionalFooter = () => {
  const { pathname } = useLocation();
  if (pathname === '/admin') return null;
  return <Footer />;
};

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt) return null;

  return (
    <div className="bg-primary text-[#181611] p-4 flex justify-between items-center shadow-lg border-b border-primary-dark">
      <div>
        <p className="font-bold">Unwrap the Magic on Your Phone!</p>
        <p className="text-sm">Install our digital storefront app directly. No App Store required!</p>
      </div>
      <button onClick={handleInstallClick} className="bg-[#181611] text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-black transition-colors">
        Install App
      </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <CartProvider>
        <WishlistProvider>
          <AuthProvider>
            <HashRouter>
                <ScrollToTop />
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <InstallBanner />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/ai-assistant" element={<AiAssistant />} />
                    <Route path="/voice-assistant" element={<VoiceAssistant />} />
                    <Route path="/image-generator" element={<ImageGenerator />} />
                    <Route path="/whatsapp-order" element={<WhatsAppOrder />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/shipping-returns" element={<ShippingReturns />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/faq" element={<Faq />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <ConditionalFooter />
                </div>
            </HashRouter>
          </AuthProvider>
        </WishlistProvider>
      </CartProvider>
    </LanguageProvider>
  );
};

export default App;