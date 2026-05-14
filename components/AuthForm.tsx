import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string, unit: string) => Promise<void>;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onSignUp }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email) {
          throw new Error('Please enter your email address to reset your password');
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        });
        if (resetError) throw resetError;
        setSuccessMessage('Password reset link sent to your email.');
      } else if (email && password) {
        if (isLogin) {
          await onLogin(email, password);
        } else {
          await onSignUp(email, password, name, unit);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = (login: boolean) => {
    setIsLogin(login);
    setIsForgotPassword(false);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a8a] text-white rounded-2xl shadow-xl mb-4">
            <i className="fa-solid fa-building-shield text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">SF Housing Hub</h1>
          <p className="text-slate-500 mt-2">Legal Protection & Issue Tracking for San Francisco Residents</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => handleToggleMode(true)}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${isLogin && !isForgotPassword ? 'text-[#1e3a8a] border-b-2 border-[#1e3a8a]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleToggleMode(false)}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLogin && !isForgotPassword ? 'text-[#1e3a8a] border-b-2 border-[#1e3a8a]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {!isLogin && !isForgotPassword && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-3 top-3 text-slate-300"></i>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Number</label>
                  <div className="relative">
                    <i className="fa-solid fa-door-open absolute left-3 top-3 text-slate-300"></i>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="302B"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3 top-3 text-slate-300"></i>
                <input
                  required
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-3 top-3 text-slate-300"></i>
                  <input
                    required
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {isForgotPassword && (
              <div className="text-left">
                <p className="text-sm text-slate-600 mb-4">Enter your email address and we'll send you a link to reset your password.</p>
                <button
                  type="button"
                  onClick={() => handleToggleMode(true)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline flex items-center mb-2"
                >
                  <i className="fa-solid fa-arrow-left mr-1"></i> Back to Login
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg flex items-center space-x-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs p-3 rounded-lg flex items-center space-x-2">
                <i className="fa-solid fa-circle-check"></i>
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-900'}`}
            >
              {loading && <i className="fa-solid fa-circle-notch animate-spin"></i>}
              <span>{isForgotPassword ? (loading ? 'Sending...' : 'Send Reset Link') : isLogin ? (loading ? 'Signing In...' : 'Sign In to Dashboard') : (loading ? 'Registering...' : 'Complete Registration')}</span>
            </button>
          </form>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
          <i className="fa-solid fa-shield-halved text-blue-600 mt-1"></i>
          <p className="text-xs text-blue-800 leading-relaxed">
            SF Housing Hub uses encrypted local storage. Your data is protected by California Consumer Privacy Act (CCPA) standards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
