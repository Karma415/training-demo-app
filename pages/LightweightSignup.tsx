import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

const LightweightSignup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteCode = searchParams.get('code') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (inviteCode) {
      validateCode(inviteCode);
    }
  }, [inviteCode]);

  const validateCode = async (code: string) => {
    const { data, error } = await supabase
      .from('signup_codes')
      .select('*')
      .eq('code', code)
      .eq('is_used', false)
      .maybeSingle();

    if (error || !data) {
      setCodeValid(false);
    } else {
      setCodeValid(true);
      setUnitNumber(data.unit_number);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const nameParts = displayName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            unit_number: unitNumber,
            is_lightweight: true,
            onboarding_completed: true // Skip full onboarding
          }
        }
      });

      if (signUpError) throw signUpError;

      // Mark invite code as used
      if (inviteCode) {
        await supabase
          .from('signup_codes')
          .update({ is_used: true })
          .eq('code', inviteCode);
      }

      // Update tenant profile to mark as lightweight
      if (authData.user) {
        await supabase
          .from('tenants')
          .update({ is_lightweight: true })
          .eq('id', authData.user.id);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-2xl shadow-blue-500/30 mb-4">
            <i className="fa-solid fa-clipboard-list text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Resident Portal</h1>
          <p className="text-blue-300/70 mt-2 text-sm">Create your account to access forms & checklists</p>
        </div>

        {success ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-circle-check text-emerald-400 text-3xl"></i>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-blue-200/70 text-sm mb-6">
              Check your email to confirm your account, then sign in to access your dashboard.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
            {/* Invite code status */}
            {inviteCode && codeValid === false && (
              <div className="bg-red-500/20 border-b border-red-400/30 p-4 flex items-center space-x-3">
                <i className="fa-solid fa-circle-exclamation text-red-400"></i>
                <p className="text-red-200 text-sm">This invite code is invalid or has already been used.</p>
              </div>
            )}
            {inviteCode && codeValid === true && (
              <div className="bg-emerald-500/20 border-b border-emerald-400/30 p-4 flex items-center space-x-3">
                <i className="fa-solid fa-circle-check text-emerald-400"></i>
                <p className="text-emerald-200 text-sm">Invite code verified! Unit <strong>{unitNumber}</strong></p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mb-1.5">Full Name</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-3 top-3 text-blue-400/40"></i>
                  <input
                    required
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-blue-300/30 transition-all"
                    placeholder="Jane Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mb-1.5">Unit Number</label>
                <div className="relative">
                  <i className="fa-solid fa-door-open absolute left-3 top-3 text-blue-400/40"></i>
                  <input
                    required
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-blue-300/30 transition-all disabled:opacity-50"
                    placeholder="302"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    disabled={!!inviteCode && codeValid === true}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="relative">
                  <i className="fa-solid fa-envelope absolute left-3 top-3 text-blue-400/40"></i>
                  <input
                    required
                    type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-blue-300/30 transition-all"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-3 top-3 text-blue-400/40"></i>
                  <input
                    required
                    type="password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-blue-300/30 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-300/70 uppercase tracking-widest mb-1.5">Confirm Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-3 top-3 text-blue-400/40"></i>
                  <input
                    required
                    type="password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-blue-300/30 transition-all"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-xs p-3 rounded-xl flex items-center space-x-2">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!!inviteCode && codeValid === false)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading && <i className="fa-solid fa-circle-notch animate-spin"></i>}
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>
            </form>

            <div className="px-8 pb-6">
              <div className="border-t border-white/10 pt-4 text-center">
                <p className="text-blue-300/50 text-xs">Already have an account?</p>
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-400 text-sm font-bold hover:underline mt-1"
                >
                  Sign in here
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SF Housing Hub link */}
        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4 flex items-start space-x-3">
          <i className="fa-solid fa-building-shield text-blue-400 mt-0.5"></i>
          <div>
            <p className="text-blue-200/70 text-xs leading-relaxed">
              Want access to full tenant protections, legal tracking, and more?
            </p>
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 text-xs font-bold hover:underline mt-1"
            >
              Create a full SF Housing Hub account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightweightSignup;
