import React from 'react';

const ShippingReturns: React.FC = () => {
  return (
    <div className="flex-grow bg-[#f8f8f5] dark:bg-[#221e10] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#2a261a] rounded-2xl shadow-xl p-6 sm:p-10 border border-[#e6e3db] dark:border-[#332f20]">
        
        {/* Header */}
        <div className="text-center border-b border-gray-100 dark:border-gray-800 pb-8 mb-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-3 block">local_shipping</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#181611] dark:text-white">
            Shipping & Returns
          </h1>
          <p className="text-[#8a8060] mt-2">
            Everything you need to know about our packaging, delivery, and return processes.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700 dark:text-gray-300">
          
          {/* Shipping Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white flex items-center gap-2 border-l-4 border-primary pl-3">
              Shipping & Delivery Policy
            </h2>
            <p className="leading-relaxed">
              We process and ship orders across India. Our team packs and dispatches your order with maximum care, using premium materials to keep your toys protected during transit.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-gray-50 dark:bg-[#332f20] rounded-xl border border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-[#181611] dark:text-white mb-2">?? Free Shipping Threshold</h3>
                <p className="text-sm">
                  Shipping is <strong>FREE</strong> for all orders above <strong>?499</strong>. For orders below this threshold, a flat shipping fee of <strong>?100</strong> will be added at checkout.
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-[#332f20] rounded-xl border border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-[#181611] dark:text-white mb-2">? Processing Time</h3>
                <p className="text-sm">
                  Most standard orders are packed and dispatched within <strong>1-2 business days</strong>. You will receive a tracking link via email/SMS as soon as the courier partner receives the package.
                </p>
              </div>
            </div>
          </section>

          {/* Delivery Timeline Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white flex items-center gap-2 border-l-4 border-primary pl-3">
              Estimated Delivery Times
            </h2>
            <div className="overflow-hidden border border-gray-100 dark:border-gray-800 rounded-xl">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-left">
                <thead className="bg-gray-50 dark:bg-[#332f20] text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Region</th>
                    <th className="px-6 py-3">Delivery Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  <tr>
                    <td className="px-6 py-4 font-medium text-[#181611] dark:text-white">West Bengal</td>
                    <td className="px-6 py-4">1 - 3 business days</td>
                  </tr>
                  <tr className="bg-gray-50/50 dark:bg-[#2e2a1e]">
                    <td className="px-6 py-4 font-medium text-[#181611] dark:text-white">Metro Cities</td>
                    <td className="px-6 py-4">3 - 5 business days</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-[#181611] dark:text-white">Rest of India</td>
                    <td className="px-6 py-4">5 - 7 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Returns & Cancellations Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white flex items-center gap-2 border-l-4 border-primary pl-3">
              10-Day Return & Exchange Window
            </h2>
            <p className="leading-relaxed">
              We stand by the quality of our products. If you receive a product that is damaged, defective, or does not meet your expectations, you can return or exchange it within <strong>10 days of delivery</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Items must be unused, in their original packaging, and with all tags intact.</li>
              <li>Returns can be requested directly from your Customer Portal dashboard.</li>
              <li>Once verified, refunds are processed to your original payment method within 5-7 business days.</li>
              <li>Order cancellations are allowed only before the package is dispatched. You can contact support at <strong>+91 72785 70727</strong> or email <strong>contact@sarkarbrothers.com</strong>.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ShippingReturns;
