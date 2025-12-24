

import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import AiAssistant from './pages/AiAssistant';
import WhatsAppOrder from './pages/WhatsAppOrder';
import Admin from './pages/Admin';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { LanguageProvider } from './contexts/LanguageContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <CartProvider>
        <WishlistProvider>
          <HashRouter>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/ai-assistant" element={<AiAssistant />} />
                <Route path="/whatsapp-order" element={<WhatsAppOrder />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </div>
          </HashRouter>
        </WishlistProvider>
      </CartProvider>
    </LanguageProvider>
  );
};

export default App;