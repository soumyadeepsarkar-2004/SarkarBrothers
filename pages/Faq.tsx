import React from 'react';

const Faq: React.FC = () => {
  return (
    <div className="flex-grow bg-[#f8f8f5] dark:bg-[#221e10] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#2a261a] rounded-2xl shadow-xl p-6 sm:p-10 border border-[#e6e3db] dark:border-[#332f20]">
        
        {/* Header */}
        <div className="text-center border-b border-gray-100 dark:border-gray-800 pb-8 mb-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-3 block">quiz</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#181611] dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-[#8a8060] mt-2">
            Got questions? We've got answers. Explore our commonly asked topics below.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          
          <div className="p-5 bg-gray-50 dark:bg-[#332f20] rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-[#181611] dark:text-white mb-2 text-base">
              Q: Do you ship to remote regions in India?
            </h3>
            <p className="text-sm leading-relaxed">
              A: Yes! We ship to almost all postal codes across India using premium express courier partners. You will receive a tracking link as soon as your package leaves our warehouse.
            </p>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-[#332f20] rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-[#181611] dark:text-white mb-2 text-base">
              Q: Are the materials used in your toys child-safe?
            </h3>
            <p className="text-sm leading-relaxed">
              A: Absolutely. All wooden blocks, custom plush toys, and playsets conform strictly to BIS toy safety standards. We use non-toxic, lead-free paints and organic materials.
            </p>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-[#332f20] rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-[#181611] dark:text-white mb-2 text-base">
              Q: How does the AI Assistant (GiftBot) help me?
            </h3>
            <p className="text-sm leading-relaxed">
              A: GiftBot recommends suitable toys based on a child's age, interests, and budget. You can access it directly via the floating icon on the bottom right. Note that this feature is gated behind authenticated user profiles to protect access.
            </p>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-[#332f20] rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-[#181611] dark:text-white mb-2 text-base">
              Q: How can I change or cancel my order?
            </h3>
            <p className="text-sm leading-relaxed">
              A: Please contact us immediately at <strong>+91 72785 70727</strong> or email <strong>contact@sarkarbrothers.com</strong> before your order is dispatched. Once shipped, orders cannot be canceled but can be returned within 10 days of delivery.
            </p>
          </div>

          <div className="p-5 bg-gray-50 dark:bg-[#332f20] rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-[#181611] dark:text-white mb-2 text-base">
              Q: How long does refund processing take?
            </h3>
            <p className="text-sm leading-relaxed">
              A: Refunds are processed within <strong>5-7 business days</strong> after we receive and inspect the returned items at our facility. The refund is credited back to your original payment method.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Faq;
