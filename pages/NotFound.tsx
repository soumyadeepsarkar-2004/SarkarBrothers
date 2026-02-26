
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="relative mb-8">
        <span className="text-[120px] sm:text-[160px] font-black text-primary/20 leading-none select-none">404</span>
        <span className="material-symbols-outlined text-6xl sm:text-7xl text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce">
          toys
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-[#181611] dark:text-white mb-3">
        Oops! Page Not Found
      </h1>
      <p className="text-lg text-[#8a8060] max-w-md mb-8">
        Looks like this toy wandered off! The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="h-12 px-8 rounded-xl bg-primary hover:bg-yellow-400 text-[#181611] font-bold text-base shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">home</span>
          Go Home
        </Link>
        <Link
          to="/shop"
          className="h-12 px-8 rounded-xl bg-white dark:bg-[#2a261a] border border-[#e6e3db] dark:border-[#332f20] hover:border-primary text-[#181611] dark:text-white font-semibold text-base transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">storefront</span>
          Browse Shop
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
