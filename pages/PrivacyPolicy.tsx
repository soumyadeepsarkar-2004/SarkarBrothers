import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="flex-grow bg-[#f8f8f5] dark:bg-[#221e10] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#2a261a] rounded-2xl shadow-xl p-6 sm:p-10 border border-[#e6e3db] dark:border-[#332f20]">
        
        {/* Header */}
        <div className="text-center border-b border-gray-100 dark:border-gray-800 pb-8 mb-8">
          <span className="material-symbols-outlined text-primary text-5xl mb-3 block">security</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#181611] dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-[#8a8060] mt-2">
            Your trust is our priority. Read about how we handle and protect your information.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700 dark:text-gray-300">
          
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white border-l-4 border-primary pl-3">
              1. Information We Collect
            </h2>
            <p className="leading-relaxed">
              We collect only the essential details required to serve you and process your transactions securely:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Personal details:</strong> Your name, email address, physical shipping address, and telephone number.</li>
              <li><strong>Authentication credentials:</strong> Secure login identifiers managed by our authentication providers.</li>
              <li><strong>Order data:</strong> Products purchased, transactions values, and shipping preferences.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white border-l-4 border-primary pl-3">
              2. How We Use Your Information
            </h2>
            <p className="leading-relaxed">
              Your details are used strictly to run the services you request:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Processing, packaging, and delivering your toy purchases.</li>
              <li>Providing real-time order tracking and invoice generation.</li>
              <li>Authenticating users and protecting against unauthorized access.</li>
              <li>Delivering AI-powered toy recommendations via our virtual GiftBot without storing or selling your search criteria.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white border-l-4 border-primary pl-3">
              3. Data Security & Integrations
            </h2>
            <p className="leading-relaxed">
              We employ industry-grade standards to secure your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Firebase Auth:</strong> Authentication is handled by production-ready Firebase integrations. We do not store plain-text passwords on our servers.</li>
              <li><strong>Encryption:</strong> Data transmitted between your browser and our backend is encrypted using secure SSL/TLS protocols.</li>
              <li><strong>No Financial Storage:</strong> We do not store credit card numbers, CVVs, or UPI credentials. All payments are securely processed directly by our payment gateway providers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-[#181611] dark:text-white border-l-4 border-primary pl-3">
              4. Cookies & Trackers
            </h2>
            <p className="leading-relaxed">
              We use lightweight local storage tokens and standard cookies strictly to keep you signed in and preserve your cart items. We do not use intrusive cross-site advertising trackers or sell your activity logs to third-party ad networks.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
