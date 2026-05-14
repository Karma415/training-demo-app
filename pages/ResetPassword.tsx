import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid session to reset the password
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        // Fallback to manual checking hash or redirect to login
        // But supabase automatically sets session from URL hash if present
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
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
      navigate('/login');
    } catch (err: any) {
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
          <p className="text-slate-500 mt-2">Enter your new password below</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <form onSubmit={handleResetPassword} className="p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">New Password</label>
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

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Confirm New Password</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-3 top-3 text-slate-300"></i>
                <input
                  required
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
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
              disabled={loading}
              className={`w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-900'}`}
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
