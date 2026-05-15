import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Verifying reset link...');
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeRecoverySession = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const hashType = hashParams.get('type');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;

          window.history.replaceState({}, document.title, '/reset-password');
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const isRecoveryLink = code || hashType === 'recovery';

        if (data.session && isRecoveryLink) {
          if (!isMounted) return;
          setHasRecoverySession(true);
          setStatusMessage('Enter your new password below.');
          return;
        }

        if (data.session && !isRecoveryLink) {
          if (!isMounted) return;
          setHasRecoverySession(true);
          setStatusMessage('You are signed in. Enter a new password below.');
          return;
        }

        if (!isMounted) return;
        setHasRecoverySession(false);
        setStatusMessage('This reset link is invalid or expired. Please request a new password reset email.');
        setError('No valid password reset session was found.');
      } catch (err: any) {
        console.error('Password recovery session initialization failed:', err);
        if (!isMounted) return;
        setHasRecoverySession(false);
        setStatusMessage('This reset link could not be verified. Please request a new password reset email.');
        setError(err.message || 'Unable to verify password reset link.');
      }
    };

    initializeRecoverySession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setHasRecoverySession(true);
        setStatusMessage('Enter your new password below.');
        setError(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRecoverySession) {
      setError('No valid password reset session was found. Please request a new reset link.');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      alert("Password updated successfully!");
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err: any) {
      console.error('Password update failed:', err);
      setError(err.message || 'An unexpected error occurred while resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a8a] text-white rounded-2xl shadow-xl mb-4">
            <i className="fa-solid fa-building-shield text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Reset Password</h1>
          <p className="text-slate-500 mt-2">{statusMessage}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <form onSubmit={handleResetPassword} className="p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">New Password</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-3 top-3 text-slate-300"></i>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-12 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Confirm New Password</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-3 top-3 text-slate-300"></i>
                <input
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-12 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg flex items-center space-x-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !hasRecoverySession}
              className={`w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 ${loading || !hasRecoverySession ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-900'}`}
            >
              {loading && <i className="fa-solid fa-circle-notch animate-spin"></i>}
              <span>{loading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
