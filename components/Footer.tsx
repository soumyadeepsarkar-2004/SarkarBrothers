
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#181611] text-gray-400 mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>toys</span>
              <span className="text-white text-xl font-bold tracking-tight">SarkarBrothers</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Curated toys that spark imagination, encourage learning, and create lasting memories for children of all ages.
            </p>
            <div className="flex gap-3">
              <a href="#" className="size-9 rounded-lg bg-white/10 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-lg">share</span>
              </a>
              <a href="#" className="size-9 rounded-lg bg-white/10 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
              <a href="#" className="size-9 rounded-lg bg-white/10 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-lg">call</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/shop" className="text-sm hover:text-primary transition-colors">{t('nav.shop')}</Link></li>
              <li><Link to="/ai-assistant" className="text-sm hover:text-primary transition-colors">{t('nav.giftbot')}</Link></li>
              <li><Link to="/voice-assistant" className="text-sm hover:text-primary transition-colors">Voice AI</Link></li>
              <li><Link to="/image-generator" className="text-sm hover:text-primary transition-colors">Image Generator</Link></li>
              <li><Link to="/whatsapp-order" className="text-sm hover:text-primary transition-colors">{t('nav.order_whatsapp')}</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li><span className="text-sm">Shipping & Returns</span></li>
              <li><span className="text-sm">Privacy Policy</span></li>
              <li><span className="text-sm">Terms of Service</span></li>
              <li><span className="text-sm">FAQ</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-primary text-base">location_on</span>
                123 Fun Lane, Joyville
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-primary text-base">call</span>
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-primary text-base">mail</span>
                contact@sarkarbrothers.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">&copy; {new Date().getFullYear()} SarkarBrothers. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-green-500 text-sm">verified_user</span>
            Secure Shopping &bull; 100% Authentic Toys
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
