import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  loginWithEmailAndPassword,
  signUpWithEmailAndPassword,
  setupRecaptcha,
  startPhoneVerification,
  ConfirmationResult,
  RecaptchaVerifier
} from '../services/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'email' | 'phone';

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, loginWithGoogle, loading, isAuthenticated, firebaseEnabled } = useAuth();
  const { t } = useLanguage();

  // Tab State
  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Status State
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Firebase References
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Mock Fallback State
  const [mockConfirmation, setMockConfirmation] = useState(false);
  const [expectedMockOtp, setExpectedMockOtp] = useState('');

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  // Reset form states on tab/sign-up toggles
  useEffect(() => {
    setError('');
    setInfo('');
    setOtpSent(false);
    setMockConfirmation(false);
    setExpectedMockOtp('');
  }, [activeTab, isSignUp]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLocalLoading(true);

    try {
      if (isSignUp) {
        if (!name || !email || !password) {
          setError('Please fill in all fields.');
          setLocalLoading(false);
          return;
        }

        if (firebaseEnabled) {
          // Real Firebase Sign Up
          await signUpWithEmailAndPassword(email, password, name);
          setInfo('Account created successfully! Logging you in...');
        } else {
          // Simulated Sign Up fallback
          setError('Firebase is not configured. Real signup is currently unavailable.');
        }
      } else {
        if (!email || !password) {
          setError('Please enter both email and password.');
          setLocalLoading(false);
          return;
        }

        if (firebaseEnabled) {
          // Real Firebase Sign In
          await loginWithEmailAndPassword(email, password);
        } else {
          // Demo Fallback Login
          const success = await login(email, password);
          if (!success) {
            setError('Invalid email or password.');
          }
        }
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!phone || !phone.startsWith('+')) {
      setError('Please enter a valid phone number with country code (e.g. +919876543210).');
      return;
    }

    setLocalLoading(true);

    try {
      if (firebaseEnabled) {
        // Initialize reCAPTCHA if not already done
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = setupRecaptcha('recaptcha-container');
        }

        const confirmationResult = await startPhoneVerification(phone, recaptchaVerifierRef.current);
        confirmationResultRef.current = confirmationResult;
        setOtpSent(true);
        setInfo('OTP code sent successfully to your phone number.');
      } else {
        // Fallback Mock OTP Generation
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setExpectedMockOtp(code);
        setMockConfirmation(true);
        setOtpSent(true);
        setInfo(`[DEMO MODE] SMS sent! Enter simulated code: ${code}`);
      }
    } catch (err: any) {
      console.error('Phone OTP Send Error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      // Fallback to Mock OTP if real OTP fails
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedMockOtp(code);
      setMockConfirmation(true);
      setOtpSent(true);
      setInfo(`Firebase Phone Auth unavailable. Entered Demo mode. Enter simulated code: ${code}`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLocalLoading(true);

    try {
      if (mockConfirmation) {
        // Verify mock OTP
        if (otpCode === expectedMockOtp) {
          // Log in with mock customer details
          const mockUser = {
            id: 'mock-phone-' + Date.now(),
            name: 'Phone User (' + phone + ')',
            email: phone + '@sarkarbrothers.com',
            phone: phone,
            avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(phone)}&radius=50`,
            bio: '',
            preferences: { newsletter: false, smsNotifications: false },
            role: 'user' as const
          };
          sessionStorage.setItem('currentUser', JSON.stringify(mockUser));
          sessionStorage.setItem('authToken', 'mock-phone-token');
          // Force page refresh or reload auth context state
          window.location.reload();
        } else {
          setError('Invalid OTP code. Please enter the correct code.');
        }
      } else if (confirmationResultRef.current) {
        // Real Firebase OTP confirmation
        await confirmationResultRef.current.confirm(otpCode);
        setInfo('Phone number verified successfully!');
      }
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      setError(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfo('');
    setLocalLoading(true);

    try {
      const success = await loginWithGoogle();
      if (!success && firebaseEnabled) {
        setError('Google Sign-In was cancelled or failed.');
      }
    } catch (err: any) {
      setError('Google Sign-In error.');
    } finally {
      setLocalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1a170d] rounded-3xl shadow-2xl overflow-hidden border border-[#e6e3db] dark:border-[#332f20] p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Invisible Recaptcha Element */}
        <div id="recaptcha-container"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#252525] text-gray-500 hover:bg-gray-200 dark:hover:bg-[#332f20] transition-colors z-10"
          aria-label="Close login modal"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="text-center mb-6">
          <div className="size-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <span className="material-symbols-outlined text-3xl">key</span>
          </div>
          <h2 className="text-xl font-bold text-[#181611] dark:text-white">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-[#8a8060] dark:text-gray-400 mt-1">
            {isSignUp ? 'Sign up to start saving recommendations and checkout' : 'Sign in to access your orders and AI features'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f5f3f0] dark:bg-[#252525] rounded-xl p-1 mb-6 border border-[#e6e3db]/40 dark:border-[#333]/50">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'email' ? 'bg-white dark:bg-[#1a170d] text-[#181611] dark:text-white shadow-sm' : 'text-[#8a8060] dark:text-gray-400'}`}
          >
            Email & Password
          </button>
          <button
            onClick={() => setActiveTab('phone')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'phone' ? 'bg-white dark:bg-[#1a170d] text-[#181611] dark:text-white shadow-sm' : 'text-[#8a8060] dark:text-gray-400'}`}
          >
            Phone (OTP)
          </button>
        </div>

        {/* Info & Error Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl mb-4 text-left border border-red-200/50 dark:border-red-900/30 flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 text-[#8a8060] dark:text-yellow-400 text-xs p-3 rounded-xl mb-4 text-left border border-yellow-200/50 dark:border-yellow-900/30 flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">info</span>
            <span>{info}</span>
          </div>
        )}

        {/* Google OAuth (Always at the top for ease of access) */}
        {firebaseEnabled && !otpSent && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || localLoading}
              className="w-full h-11 bg-white dark:bg-[#2a261a] border border-[#e6e3db] dark:border-[#332f20] hover:border-primary hover:bg-[#f5f3f0] dark:hover:bg-[#332f20] text-[#181611] dark:text-white text-xs font-bold rounded-xl transition-all active:translate-y-0.5 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || localLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
            <div className="flex items-center gap-4 mt-5">
              <div className="flex-1 h-px bg-[#e6e3db]/60 dark:bg-[#332f20]/60"></div>
              <span className="text-[10px] font-bold text-[#8a8060] uppercase tracking-wider">or use credentials</span>
              <div className="flex-1 h-px bg-[#e6e3db]/60 dark:bg-[#332f20]/60"></div>
            </div>
          </div>
        )}

        {/* Email & Password Tab */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 border border-[#e6e3db] dark:border-[#332f20] rounded-xl bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-xs"
                  placeholder="Full Name"
                  disabled={loading || localLoading}
                />
              </div>
            )}
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-[#e6e3db] dark:border-[#332f20] rounded-xl bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-xs"
                placeholder="Email address"
                disabled={loading || localLoading}
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-[#e6e3db] dark:border-[#332f20] rounded-xl bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-xs"
                placeholder="Password"
                disabled={loading || localLoading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || localLoading}
              className="w-full h-11 bg-primary hover:bg-[#e5b31f] text-[#181611] font-bold py-2 rounded-xl shadow-md transition-all active:translate-y-0.5 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              {loading || localLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">{isSignUp ? 'person_add' : 'login'}</span>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </>
              )}
            </button>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}

        {/* Phone OTP Tab */}
        {activeTab === 'phone' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
            {!otpSent ? (
              <div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-4 py-3 border border-[#e6e3db] dark:border-[#332f20] rounded-xl bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white placeholder-[#8a8060] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-xs"
                  placeholder="Phone Number (e.g. +919876543210)"
                  disabled={loading || localLoading}
                />
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-4 py-3 border border-[#e6e3db] dark:border-[#332f20] rounded-xl bg-[#f5f3f0] dark:bg-[#2a261a] text-[#181611] dark:text-white text-center font-bold tracking-widest focus:ring-1 focus:ring-primary focus:border-primary outline-none text-base placeholder-gray-400"
                  placeholder="------"
                  disabled={loading || localLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || localLoading}
              className="w-full h-11 bg-primary hover:bg-[#e5b31f] text-[#181611] font-bold py-2 rounded-xl shadow-md transition-all active:translate-y-0.5 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              {loading || localLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">{otpSent ? 'verified' : 'sms'}</span>
                  {otpSent ? 'Verify OTP Code' : 'Send Verification OTP'}
                </>
              )}
            </button>

            {otpSent && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-[10px] font-bold text-gray-500 hover:text-black dark:hover:text-white hover:underline"
                >
                  Change phone number
                </button>
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginModal;
