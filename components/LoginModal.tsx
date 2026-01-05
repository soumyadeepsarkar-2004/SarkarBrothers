
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Relative import
import { useLanguage } from '../contexts/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose(); // Close modal automatically on successful login
    }
  }, [isAuthenticated, isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-[#1a170d] rounded-2xl shadow-2xl overflow-hidden border border-[#e6e3db] dark:border-[#332f20]"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking on the modal content
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#252525] text-gray-500 hover:bg-gray-200 dark:hover:bg-[#332f20] transition-colors z-10"
          aria-label="Close login modal"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="p-8 text-center">
          <div className="size-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">person</span>
          </div>
          <h2 className="text-2xl font-bold text-[#181611] dark:text-white mb-2">Welcome Back!</h2>
          <p className="text-sm text-[#8a8060] dark:text-gray-400 mb-8">Sign in to manage your orders, wishlist, and profile.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-[#e6e3db] dark:border-[#332f20] rounded-xl bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                placeholder="Email address"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-[#e6e3db] dark:border-[#332f20] rounded-xl bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                placeholder="Password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm py-2" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  Sign In
                </>
              )}
            </button>
          </form>
          <p className="mt-6 text-xs text-[#8a8060] dark:text-gray-500">
            Don't have an account? <a href="#" className="font-semibold text-primary hover:underline">Sign up now</a> (Not implemented in demo)
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-600">
            Use <span className="font-bold">user@example.com</span> / <span className="font-bold">password</span> for user.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-600">
            Use <span className="font-bold">admin@example.com</span> / <span className="font-bold">adminpass</span> for admin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
