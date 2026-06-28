import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="flex-grow bg-[#f8f8f5] dark:bg-[#221e10] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#2a261a] rounded-2xl shadow-xl p-6 sm:p-10 border border-[#e6e3db] dark:border-[#332f20]">
        
        {/* Header */}
        <div className="text-center border-b border-gray-100 dark:border-gray-800 pb-8 mb-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-3 block">gavel</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#181611] dark:text-white">
            Terms of Service
          </h1>
          <p className="text-[#8a8060] mt-2">
            The rules and legal agreements governing your use of the Sarkar Brothers platform.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700 dark:text-gray-300">
          
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white border-l-4 border-primary pl-3">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed">
              By accessing our store, creating a registered customer profile, or placing toy orders, you agree to comply fully with these terms. If you do not agree, please discontinue using our site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white border-l-4 border-primary pl-3">
              2. User Accounts & Verification
            </h2>
            <p className="leading-relaxed">
              Certain features (AI Assistants, AI Image Generator, and Order Checkout) are gated behind authenticated user profiles:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>You agree to provide true, accurate, and current information during registration.</li>
              <li>Authentication is completed using secure email/password setup or telephone SMS OTP verification.</li>
              <li>You are entirely responsible for protecting your credentials and limiting access to your account.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white border-l-4 border-primary pl-3">
              3. Inventory & Price Discrepancies
            </h2>
            <p className="leading-relaxed">
              While we make every effort to display accurate product details, stock amounts, and pricing, discrepancies may occur. Sarkar Brothers reserves the right to modify prices or cancel orders in cases of stock availability issues or pricing system errors. If an order is canceled, we will issue a full refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white border-l-4 border-primary pl-3">
              4. IP & Brand Copyrights
            </h2>
            <p className="leading-relaxed">
              All branding vectors, graphics, web portal source code, custom toy descriptions, and catalog assets are owned exclusively by Sarkar Brothers. Replicating, adapting, or using these materials for competitive commercial purposes without explicit permission is strictly prohibited.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
