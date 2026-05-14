import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { HistoricalDataForm } from '../components/HistoricalDataForm';

const Onboarding: React.FC = () => {
  const { user, session } = useAuth();
  const { refetchUser, user: appUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (appUser.role === 'legal_counsel') {
      navigate('/legal-dashboard', { replace: true });
    } else if (appUser.role === 'admin' || appUser.role === 'superadmin') {
      navigate('/admin-dashboard', { replace: true });
    }
  }, [appUser.role, navigate]);

  const [step, setStep] = useState(1);

  // Step 1: Personal Info State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [unit, setUnit] = useState('');
  const [phone, setPhone] = useState('');
  const [rent, setRent] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  
  // Step 3: Historical Issues State
  const [pastIssues, setPastIssues] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingLease, setIsUploadingLease] = useState(false);
  const [leaseUploaded, setLeaseUploaded] = useState(false);

  const handleLeaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploadingLease(true);
      setTimeout(() => {
          setIsUploadingLease(false);
          setLeaseUploaded(true);
          
          // Automatically advance after showing success for a brief moment
          setTimeout(() => {
              setStep(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 1200);

      }, 1500); // Simulate upload delay for demo
    }
  };

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!session) {
      navigate('/login');
    } else if (user?.user_metadata) {
       setFirstName(user.user_metadata.first_name || '');
       setLastName(user.user_metadata.last_name || '');
       setUnit(user.user_metadata.unit_number?.toString() || '');
    }
  }, [session, user, navigate]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError(null);
    setLoading(true);

    try {
      // 1. Fetch a default building ID 
      const { data: buildings, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .limit(1);

      if (buildingError) throw buildingError;
      
      const buildingId = buildings && buildings.length > 0 ? buildings[0].id : null;

      // 2. Update tenants table
      const { data: updatedData, error: profileError } = await supabase
        .from('tenants')
        .update({
          phone: phone.trim() === '' ? 'Not Provided' : phone,
          unit_number: unit ? parseInt(unit) : null,
          monthly_rent: rent ? parseFloat(rent) : null,
          move_in_date: moveInDate || null,
          building_id: buildingId,
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', user.id)
        .select();

      // Fallback if update fails because row doesn't exist yet (count === 0)
      if (profileError || !updatedData || updatedData.length === 0) {
         console.warn("Update failed or 0 rows matched, trying insert:", profileError);
         const { error: insertError } = await supabase.from('tenants').insert([{
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            phone: phone.trim() === '' ? 'Not Provided' : phone,
            unit_number: unit ? parseInt(unit) : null,
            monthly_rent: rent ? parseFloat(rent) : null,
            move_in_date: moveInDate || null,
            building_id: buildingId
         }]);
         
         if (insertError) {
             throw new Error("Could not create tenant profile: " + insertError.message);
         }
      }

      // 3. Update auth metadata (name)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
            first_name: firstName, 
            last_name: lastName,
            unit_number: unit
        }
      });

      if (updateError) throw updateError;
      
      setStep(2); // Go to Step 2
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
        await supabase.auth.updateUser({
           data: { onboarding_completed: true }
        });
        await refetchUser();
        navigate('/');
    } catch (err: any) {
        setError("Failed to finalize onboarding.");
    } finally {
        setLoading(false);
    }
  };

  if (!user) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col">
            <div className="w-12 h-12 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold">Loading your profile...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Progress Bar */}
        <div className="mb-8 px-4 sm:px-0">
          <div className="flex items-center justify-between">
            <div className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-[#1e3a8a]' : 'text-slate-400'}`}>1. Profile</div>
            <div className={`flex-1 h-1 mx-4 rounded-full ${step >= 2 ? 'bg-[#1e3a8a]' : 'bg-slate-200'}`}></div>
            <div className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-[#1e3a8a]' : 'text-slate-400'}`}>2. Documents</div>
            <div className={`flex-1 h-1 mx-4 rounded-full ${step >= 3 ? 'bg-[#1e3a8a]' : 'bg-slate-200'}`}></div>
            <div className={`text-xs font-bold uppercase tracking-wider ${step >= 3 ? 'text-[#1e3a8a]' : 'text-slate-400'}`}>3. History</div>
          </div>
        </div>

        {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <i className="fa-solid fa-triangle-exclamation text-red-500 mt-0.5 mr-3"></i>
                <p className="text-sm text-red-700">{error}</p>
            </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a8a] text-white rounded-2xl shadow-xl mb-4">
                  <i className="fa-solid fa-user-check text-3xl"></i>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Complete Your Profile</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Welcome! We need a few details to set up your account.
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input type="text" id="firstName" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3a8a] focus:ring-[#1e3a8a] sm:text-sm p-2 border bg-slate-50" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input type="text" id="lastName" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3a8a] focus:ring-[#1e3a8a] sm:text-sm p-2 border bg-slate-50" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit Number</label>
                <input type="text" id="unit" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3a8a] focus:ring-[#1e3a8a] sm:text-sm p-2 border bg-slate-50" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" id="phone" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3a8a] focus:ring-[#1e3a8a] sm:text-sm p-2 border bg-slate-50" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rent" className="block text-sm font-medium text-gray-700">Monthly Rent ($)</label>
                  <input type="number" id="rent" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3a8a] focus:ring-[#1e3a8a] sm:text-sm p-2 border bg-slate-50" value={rent} onChange={(e) => setRent(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700">Move-In Date</label>
                  <input type="date" id="moveInDate" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#1e3a8a] focus:ring-[#1e3a8a] sm:text-sm p-2 border bg-slate-50" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#1e3a8a] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a8a] disabled:opacity-50 transition-colors">
                {loading ? 'Saving...' : 'Continue to Documents'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Documents / Lease Decoder */}
        {step === 2 && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl shadow-inner border border-blue-200 mb-4">
                  <i className="fa-solid fa-file-contract text-3xl"></i>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Upload Documents</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Upload your lease agreement. We can help you understand your rights using the Lease Decoder.
                </p>
            </div>

            <div 
               className={`border-2 border-dashed ${leaseUploaded ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:bg-slate-50'} rounded-xl p-8 text-center transition-colors cursor-pointer mb-6 group relative`}
               onClick={() => !isUploadingLease && !leaseUploaded && fileInputRef.current?.click()}
            >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept=".pdf,.doc,.docx,.jpg,.png" 
                  onChange={handleLeaseUpload} 
                />
                
                {isUploadingLease ? (
                  <>
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-bold text-blue-700">Analyzing Document...</p>
                    <p className="text-xs text-blue-500 mt-1">Extracting lease intelligence</p>
                  </>
                ) : leaseUploaded ? (
                  <>
                    <i className="fa-solid fa-circle-check text-4xl text-green-500 mb-4 transition-colors"></i>
                    <p className="font-bold text-green-700">Lease Uploaded Successfully</p>
                    <p className="text-xs text-green-600 mt-1">Ready for decoding</p>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up text-4xl text-slate-400 group-hover:text-[#1e3a8a] mb-4 transition-colors"></i>
                    <p className="font-bold text-slate-700">Select Lease File</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, DOC, or image files up to 10MB</p>
                  </>
                )}
            </div>

            <div className="flex flex-col space-y-3">
              <button onClick={() => window.open('/lease-decoder', '_blank')} className="w-full flex justify-center items-center py-2.5 px-4 border border-blue-200 rounded-lg shadow-sm text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                <i className="fa-solid fa-magnifying-glass-chart mr-2"></i>
                Try Lease Decoder First
              </button>

              <button onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#1e3a8a] hover:bg-blue-900 transition-colors">
                {leaseUploaded ? 'Continue' : 'Skip & Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Historical Issues */}
        {step === 3 && (
          <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
             <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl shadow-inner border border-orange-200 mb-4">
                  <i className="fa-solid fa-clock-rotate-left text-3xl"></i>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Log Past Issues</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Do you have any ongoing or historical issues from more than 7 days ago?
                </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <HistoricalDataForm 
                    directSubmitToSupabase={true} 
                    onAddEntry={(entry) => setPastIssues([...pastIssues, entry])} 
                />
            </div>

            {pastIssues.length > 0 && (
                <div className="mb-6">
                   <h4 className="text-sm font-bold text-slate-700 mb-2">Logged Issues ({pastIssues.length})</h4>
                   <ul className="text-sm text-slate-600 space-y-2">
                       {pastIssues.map((i, idx) => (
                           <li key={idx} className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center">
                               <span>{i.topic || i.type || 'Historical Issue'}</span>
                               <span className="text-xs bg-slate-100 px-2 rounded-full">{i.date}</span>
                           </li>
                       ))}
                   </ul>
                </div>
            )}

            <button onClick={completeOnboarding} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-green-600 hover:bg-green-700 transition-colors mt-6">
              <i className="fa-solid fa-rocket mr-2 mt-0.5"></i> Finish Setup & Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
