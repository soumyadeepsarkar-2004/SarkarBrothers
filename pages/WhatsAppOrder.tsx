
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/formatters';
import { useLanguage } from '../contexts/LanguageContext';

const WhatsAppOrder: React.FC = () => {
  const { items, cartTotal } = useCart();
  const { t } = useLanguage();

  const phoneNumber = '919876543210';

  // Build message from actual cart items, or a generic greeting
  const buildMessage = () => {
    if (items.length > 0) {
      const itemLines = items.map(i => `• ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`).join('\n');
      return `Hello SarkarBrothers'! 👋\n\nI'd like to order:\n${itemLines}\n\nTotal: ${formatPrice(cartTotal)}\n\nPlease confirm availability and payment details. Thank you!`;
    }
    return `Hello SarkarBrothers'! 👋\n\nI'd like to place an order. Could you help me with availability and payment details? Thank you!`;
  };

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(buildMessage())}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-lg text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-[#25D366]/10 mb-6">
          <span className="material-symbols-outlined text-[#25D366] text-4xl">chat</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-[#181611] dark:text-white mb-3">
          Order via WhatsApp
        </h1>
        <p className="text-[#8a8060] dark:text-[#cdc7b0] text-lg mb-8 max-w-md mx-auto">
          Chat with us directly to confirm your order, check availability, and arrange payment.
        </p>

        {/* Cart summary if items exist */}
        {items.length > 0 && (
          <div className="bg-white dark:bg-[#2a261a] rounded-xl border border-[#f5f3f0] dark:border-[#332e24] p-4 mb-6 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8a8060] mb-3">Your Cart ({items.length} items)</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="size-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#181611] dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-[#8a8060]">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-[#181611] dark:text-white shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#f5f3f0] dark:border-[#332e24] flex justify-between">
              <span className="font-bold text-[#181611] dark:text-white">Total</span>
              <span className="font-black text-primary">{formatPrice(cartTotal)}</span>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex w-full items-center justify-center gap-3 h-14 px-8 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white text-lg font-bold shadow-lg shadow-[#25D366]/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">chat</span>
          {items.length > 0 ? 'Send Order on WhatsApp' : 'Chat with Us on WhatsApp'}
        </a>

        <p className="text-xs text-[#8a8060] mt-3">
          Opens WhatsApp Web on desktop or the WhatsApp app on mobile.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-6 justify-center mt-8 pt-6 border-t border-[#f5f3f0] dark:border-[#332e24]">
          <div className="flex items-center gap-1.5 text-sm font-medium text-[#8a8060]">
            <span className="material-symbols-outlined text-green-500 text-base">verified_user</span>
            Secure
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-[#8a8060]">
            <span className="material-symbols-outlined text-blue-500 text-base">bolt</span>
            Instant Reply
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-[#8a8060]">
            <span className="material-symbols-outlined text-primary text-base">sentiment_satisfied</span>
            Human Support
          </div>
        </div>

        {/* Prompt to add items */}
        {items.length === 0 && (
          <div className="mt-8 p-4 bg-[#f5f3f0] dark:bg-[#2a261a] rounded-xl">
            <p className="text-sm text-[#8a8060] mb-2">Want to send a specific order?</p>
            <Link to="/shop" className="inline-flex items-center gap-1 text-primary font-bold text-sm hover:underline">
              Browse our shop first
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppOrder;