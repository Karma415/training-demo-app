import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Eye, EyeOff, User, Mail, Lock, DoorOpen, Phone, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp?: (email: string, password: string, name: string, unit: string) => Promise<void>;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'forgot-password' | 'request-access'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Request Access Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [unit, setUnit] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'forgot-password') {
        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
          throw new Error('Please enter your email address to reset your password');
        }

        const redirectTo = `${window.location.origin}/reset-password`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo,
        });

        if (resetError) {
          console.error('Password reset email failed:', resetError);
          throw resetError;
        }

        setSuccessMessage('Password reset link sent to your email.');
      } else if (mode === 'login') {
        if (email && password) {
          await onLogin(email.trim(), password);
        }
      } else if (mode === 'request-access') {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !unit.trim()) {
          throw new Error('Please fill in all required fields.');
        }

        const { error: insertError } = await supabase
          .from('access_requests')
          .insert([{
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim().toLowerCase(),
            unit_number: unit.trim(),
            phone: phone.trim() || null
          }]);

        if (insertError) {
          if (insertError.message.includes('unique constraint') || insertError.code === '23505') {
            throw new Error('A request with this email has already been submitted.');
          }
          throw insertError;
        }

        setSuccessMessage('Request submitted! Our team will verify your tenancy details and set up your account.');
        // Reset fields
        setFirstName('');
        setLastName('');
        setUnit('');
        setPhone('');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = (newMode: typeof mode) => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a8a] text-white rounded-2xl shadow-xl mb-4">
            <i className="fa-solid fa-building-shield text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">SF Housing Hub</h1>
          <p className="text-slate-500 mt-2">Legal Protection & Issue Tracking for San Francisco Residents</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-100 p-6 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800 text-center">
              {mode === 'login' && 'Sign In to Your Portal'}
              {mode === 'forgot-password' && 'Reset Password'}
              {mode === 'request-access' && 'Request Account Access'}
            </h2>
            <p className="text-slate-500 text-xs text-center mt-1">
              {mode === 'login' && 'Enter your credentials to access your tenant dashboard.'}
              {mode === 'forgot-password' && 'Receive a link to recover your account.'}
              {mode === 'request-access' && 'Submit details to request a tenant profile.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Request Access Fields */}
            {mode === 'request-access' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">First Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
                      <input
                        required
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        placeholder="Jane"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Last Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
                      <input
                        required
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Number *</label>
                    <div className="relative">
                      <DoorOpen className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
                      <input
                        required
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        placeholder="302B"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
                      <input
                        type="tel"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        placeholder="(415) 555-0199"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Field (Used in all modes) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Email Address {mode === 'request-access' && '*'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
                <input
                  required
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  placeholder="jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field (Used only in login) */}
            {mode === 'login' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot-password')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-12 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Go Back buttons for non-login states */}
            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs p-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-900'}`}
            >
              {loading && <i className="fa-solid fa-circle-notch animate-spin"></i>}
              <span>
                {mode === 'login' && (loading ? 'Signing In...' : 'Sign In')}
                {mode === 'forgot-password' && (loading ? 'Sending...' : 'Send Reset Link')}
                {mode === 'request-access' && (loading ? 'Submitting Request...' : 'Submit Request')}
              </span>
            </button>
          </form>

          {/* Request Access footer text on Login screen */}
          {mode === 'login' && (
            <div className="bg-slate-50/80 border-t border-slate-100 px-8 py-4 text-center">
              <span className="text-slate-500 text-xs font-medium">Don't have an account? </span>
              <button
                type="button"
                onClick={() => handleSwitchMode('request-access')}
                className="text-blue-600 text-xs font-bold hover:underline"
              >
                Request Access Here
              </button>
            </div>
          )}
        </div>

        {/* CCPA Privacy Info */}
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
