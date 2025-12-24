import React from 'react';

const WhatsAppOrder: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-8 md:py-12 bg-background-light dark:bg-background-dark min-h-screen">
      <div className="w-full max-w-5xl">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-4 text-[#181611] dark:text-white">
            Ready to make someone smile?
          </h1>
          <p className="text-lg text-[#8a8060] dark:text-[#cdc7b0]">
            Chat with us directly to confirm availability and payment details. We'll verify your order personally.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Summary */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#2a261a] rounded-xl shadow-sm border border-[#f5f3f0] dark:border-[#332e24] overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#8a8060] dark:text-primary mb-4">Order Summary</h3>
                <div className="aspect-video w-full rounded-lg bg-gray-100 dark:bg-gray-800 mb-6 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDPT8wHbm0-aMkluiQOenYAyR12AC0cz2mdtjn2kL7lLXPW5dafB9fkiAVR6Q3HDiM8E-Dwx6rYJNOC5_gFxnv8siP8Vb6yApoKd7uYGBJJygi5F8Vk_kMe7iShqWyhxJLj_OKH3g5QAV66nx6NGQb-OT5U5q5pAwuZxYGelPiV7xaSFaC1jx_zLC0G-A6Tzlo1P9qeeXA74I8AFCdtJ7fXFRUiWquTr4qqXbKqCF1kCoxVwUPF19f2p9ZiQvTj3ntzDJFx0tfNYnMk")' }}></div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-xl font-bold leading-tight text-[#181611] dark:text-white">Super Galactic Space Robot</h4>
                    <span className="text-xl font-bold text-primary whitespace-nowrap">$45.00</span>
                  </div>
                  <p className="text-sm text-[#8a8060] dark:text-[#a39b85]">Robot • 3+ Years</p>
                </div>
                <hr className="my-4 border-[#f5f3f0] dark:border-[#443e32]" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#8a8060] dark:text-[#a39b85]">Estimated Tax</span>
                  <span className="font-medium text-[#181611] dark:text-white">Calculated in chat</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-[#8a8060] dark:text-[#a39b85]">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>
              <div className="bg-[#f8f8f5] dark:bg-[#332e24] px-6 py-4 flex items-center justify-between">
                <span className="font-bold text-[#181611] dark:text-white">Total</span>
                <span className="font-black text-xl text-[#181611] dark:text-white">$45.00</span>
              </div>
            </div>
          </div>

          {/* Right Column: Process */}
          <div className="lg:col-span-7 lg:pl-10 flex flex-col justify-center h-full">
            <div className="mb-10 relative">
              <div className="absolute left-[19px] top-8 bottom-4 w-0.5 bg-[#f5f3f0] dark:bg-[#332e24]"></div>
              
              <div className="flex gap-5 mb-8 relative">
                <div className="size-10 rounded-full bg-primary flex items-center justify-center shrink-0 z-10 shadow-md">
                  <span className="material-symbols-outlined text-white text-[20px]">send</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-bold text-[#181611] dark:text-white">Send Order Request</h3>
                  <p className="text-[#8a8060] dark:text-[#a39b85] text-sm mt-1">Click the button below to open WhatsApp with your pre-filled order details.</p>
                </div>
              </div>

              <div className="flex gap-5 mb-8 relative">
                <div className="size-10 rounded-full bg-white dark:bg-[#2a261a] border-2 border-primary/30 flex items-center justify-center shrink-0 z-10">
                  <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-bold text-[#181611] dark:text-white">Receive Payment Link</h3>
                  <p className="text-[#8a8060] dark:text-[#a39b85] text-sm mt-1">Our team will confirm stock and send a secure Stripe payment link directly in the chat.</p>
                </div>
              </div>

              <div className="flex gap-5 relative">
                <div className="size-10 rounded-full bg-white dark:bg-[#2a261a] border-2 border-[#f5f3f0] dark:border-[#443e32] flex items-center justify-center shrink-0 z-10">
                  <span className="material-symbols-outlined text-[#8a8060] text-[20px]">inventory_2</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-bold text-[#181611] dark:text-white opacity-60">Order Confirmed</h3>
                  <p className="text-[#8a8060] dark:text-[#a39b85] text-sm mt-1 opacity-60">Once paid, we'll ship your item or prepare it for store pickup immediately.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-16 px-8 bg-primary hover:bg-[#e0b020] transition-all text-[#181611] gap-3 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40">
                <span className="material-symbols-outlined text-[28px] group-hover:scale-110 transition-transform">chat</span>
                <span>Order via WhatsApp</span>
              </button>
              <p className="text-[#8a8060] dark:text-[#8a8060] text-sm text-center">
                This will open WhatsApp Web if you are on desktop.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 md:gap-8 justify-center lg:justify-start pt-6 border-t border-[#f5f3f0] dark:border-[#332e24]">
              <div className="flex items-center gap-2 text-sm font-medium text-[#181611] dark:text-[#cdc7b0]">
                <span className="material-symbols-outlined text-green-600">verified_user</span>
                Secure Payment
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[#181611] dark:text-[#cdc7b0]">
                <span className="material-symbols-outlined text-blue-600">bolt</span>
                Instant Reply
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-[#181611] dark:text-[#cdc7b0]">
                <span className="material-symbols-outlined text-primary">sentiment_satisfied</span>
                Human Support
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppOrder;