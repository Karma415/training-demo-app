import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

const QrLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No login token provided. Please scan a valid resident QR code.');
      return;
    }

    const performQrLogin = async () => {
      try {
        // Query the public-readable (with token) credentials table
        const { data, error } = await supabase
          .from('tenant_qr_logins')
          .select('email, password_plain')
          .eq('token', token)
          .maybeSingle();

        if (error) {
          console.error('Error fetching token credentials:', error);
          throw new Error('Verification failed. The link might be expired.');
        }

        if (!data) {
          throw new Error('This QR login link is invalid or has been revoked.');
        }

        // Attempt sign-in with retrieved credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password_plain,
        });

        if (signInError) {
          console.error('Error logging in with token credentials:', signInError);
          throw signInError;
        }

        setStatus('success');
        
        // Wait 1.5 seconds for visual success feedback, then redirect to root
        setTimeout(() => {
          navigate('/');
        }, 1500);

      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to authenticate. Please try again.');
      }
    };

    performQrLogin();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-2xl shadow-blue-500/30 mb-4 animate-pulse">
            <i className="fa-solid fa-building-shield text-3xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Resident Portal</h1>
          <p className="text-blue-300/60 mt-2 text-sm">One-Scan Instant Authentication</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden p-8 shadow-2xl relative">
          
          {status === 'loading' && (
            <div className="text-center py-6 space-y-6">
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Verifying QR Code...</h2>
                <p className="text-blue-200/70 text-sm">
                  We are securely authenticating your resident session. Please hold on.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Welcome Back!</h2>
                <p className="text-emerald-300/80 text-sm">
                  Authentication successful. Redirecting you to your Resident Checklist...
                </p>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                <div className="bg-emerald-400 h-full w-full origin-left animate-load-progress"></div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-rose-500/20 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
                <ShieldAlert className="w-10 h-10 text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
                <p className="text-rose-200/80 text-sm leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                >
                  Go to Standard Login
                </button>
                <p className="text-xs text-blue-300/40 font-medium">
                  Contact building management if you need a new QR login key.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default QrLogin;
