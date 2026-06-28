
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const PolicyModal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight border-b border-gray-100 dark:border-gray-700 pb-4">
          {title}
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-4 leading-relaxed font-medium">
          {children}
        </div>
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const [modalType, setModalType] = useState<string | null>(null);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: 'Sarkar Brothers',
        text: 'Discover curated premium toys at Sarkar Brothers.',
        url: window.location.origin
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('Store link copied to clipboard!');
    }
  };

  const getModalContent = () => {
    switch (modalType) {
      case 'shipping':
        return {
          title: 'Shipping & Returns',
          content: (
            <>
              <h4 className="font-bold text-gray-950 dark:text-white">Shipping Policy</h4>
              <p>We process and ship orders across India. Standard orders are packed and dispatched within 1-2 business days. Shipping is FREE for orders above ₹499; otherwise, a flat shipping rate of ₹100 applies.</p>
              <h4 className="font-bold text-gray-950 dark:text-white mt-4">Estimated Delivery</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>West Bengal: 1 - 3 business days</li>
                <li>Metro Cities: 3 - 5 business days</li>
                <li>Rest of India: 5 - 7 business days</li>
              </ul>
              <h4 className="font-bold text-gray-950 dark:text-white mt-4">10-Day Return Window</h4>
              <p>We offer a hassle-free 10-day return policy. If you receive a product that is damaged or does not meet your expectations, you can return it within 10 days of delivery. The item must be unused, in its original packaging, and tags intact.</p>
            </>
          )
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          content: (
            <>
              <h4 className="font-bold text-gray-950 dark:text-white">Your Privacy is Priority</h4>
              <p>We collect essential shipping and contact details (name, email address, phone number, and physical address) strictly to fulfill your purchases. Authentication is handled securely through production-grade Firebase Auth integrations.</p>
              <h4 className="font-bold text-gray-950 dark:text-white mt-4">Financial Transactions</h4>
              <p>We do not store credit card numbers, passwords, or UPI pins. All payments are encrypted and processed through verified payment gateway aggregators.</p>
              <h4 className="font-bold text-gray-950 dark:text-white mt-4">No Third-Party Sharing</h4>
              <p>Your credentials and browsing history are never sold, rented, or distributed. AI features like GiftBot use your input solely to generate recommendations in real-time.</p>
            </>
          )
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          content: (
            <>
              <h4 className="font-bold text-gray-950 dark:text-white">Service Agreement</h4>
              <p>By creating an account, registering via phone number, or placing orders at Sarkar Brothers, you agree to comply with our commercial terms and verify your details accurately.</p>
              <h4 className="font-bold text-gray-950 dark:text-white mt-4">Product Catalog & Orders</h4>
              <p>We aim to keep our inventory and pricing completely updated. We reserve the right to modify prices or cancel orders in cases of stock discrepancies or verification failures.</p>
              <h4 className="font-bold text-gray-950 dark:text-white mt-4">Copyright & Trademarks</h4>
              <p>All catalog designs, custom plush designs, and AI generated art on this platform are owned by Sarkar Brothers. Unauthorized replication is strictly prohibited.</p>
            </>
          )
        };
      case 'faq':
        return {
          title: 'Frequently Asked Questions',
          content: (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-950 dark:text-white">Q: Do you ship to remote regions?</h4>
                <p>A: Yes! We ship to almost all zip codes in India through premium express delivery partners.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-950 dark:text-white">Q: Are the materials child-safe?</h4>
                <p>A: Absolutely. All wooden blocks, custom plush toys, and playsets conform strictly to BIS toy safety standards.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-950 dark:text-white">Q: How does the AI Assistant help me?</h4>
                <p>A: GiftBot recommends suitable toys based on a child's age, interests, and budget. You can access it directly via the floating icon.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-950 dark:text-white">Q: How can I change my order details?</h4>
                <p>A: Contact us immediately at +91 72785 70727 or email contact@sarkarbrothers.com before your order is dispatched.</p>
              </div>
            </div>
          )
        };
      default:
        return null;
    }
  };

  const activeModal = getModalContent();

  return (
    <footer className="bg-[#181611] text-gray-400 mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/image.svg" alt="Sarkar Brothers Logo" className="h-16 w-auto object-contain" />
            </Link>
            <p className="text-sm leading-relaxed">
              Curated toys that spark imagination, encourage learning, and create lasting memories for children of all ages.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleShare} 
                className="size-9 rounded-lg bg-white/10 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
                title="Share Store Link"
              >
                <span className="material-symbols-outlined text-lg">share</span>
              </button>
              <a 
                href="mailto:contact@sarkarbrothers.com" 
                className="size-9 rounded-lg bg-white/10 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors"
                title="Email Us"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
              <a 
                href="tel:+917278570727" 
                className="size-9 rounded-lg bg-white/10 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-colors"
                title="Call Us"
              >
                <span className="material-symbols-outlined text-lg">call</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-primary transition-colors">{t('nav.shop')}</Link></li>
              <li><Link to="/ai-assistant" className="hover:text-primary transition-colors">{t('nav.giftbot')}</Link></li>
              <li><Link to="/voice-assistant" className="hover:text-primary transition-colors">Voice AI</Link></li>
              <li><Link to="/image-generator" className="hover:text-primary transition-colors">Image Generator</Link></li>
              <li>
                <a 
                  href="https://wa.me/917278570727?text=Hello%20Sarkar%20Brothers!%20I%20would%20like%20to%20inquire%20about%20your%20toy%20collection." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  Order via WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shipping-returns" className="hover:text-primary transition-colors text-left block w-full">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-primary transition-colors text-left block w-full">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-primary transition-colors text-left block w-full">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary transition-colors text-left block w-full">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm leading-relaxed max-w-xs">
                <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">location_on</span>
                <span>Shop No. 253, A-2 Market, Block A2, Block A, Kalyani, West Bengal 741235</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-primary text-base">call</span>
                <a href="tel:+917278570727" className="hover:text-primary transition-colors">+91 72785 70727</a>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-primary text-base">mail</span>
                <a href="mailto:contact@sarkarbrothers.com" className="hover:text-primary transition-colors">contact@sarkarbrothers.com</a>
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

      {/* Policy and Info Modal */}
      {activeModal && (
        <PolicyModal 
          isOpen={!!modalType} 
          onClose={() => setModalType(null)} 
          title={activeModal.title}
        >
          {activeModal.content}
        </PolicyModal>
      )}
    </footer>
  );
};

export default Footer;
