
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
// This assumes you ran: npm install lucide-react (Done!)
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (incidentId: string, wantsLegalNotice: boolean) => void;
  onSubmit?: (issue: any) => void; // Legacy support for Dashboard state updates
}

const ReportIssueForm: React.FC<Props> = ({ isOpen, onClose, onSuccess, onSubmit }) => {
  const { user, fetchIssues, habitabilityRules } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wantsLegalNotice, setWantsLegalNotice] = useState(false);

  const rulesToUse = habitabilityRules && habitabilityRules.length > 0 
    ? habitabilityRules 
    : [
        { id: 'h1', category: 'Plumbing', issue_name: 'No cold/hot water', repair_clock_hours: 24, legal_citation: 'CA Civil Code § 1941.1' },
        { id: 'h2', category: 'Plumbing', issue_name: 'Toilet leaking/broken', repair_clock_hours: 24, legal_citation: 'CA Civil Code § 1941.1' },
        { id: 'h3', category: 'Pest', issue_name: 'Rodent Infestation', repair_clock_hours: 72, legal_citation: 'CA Civil Code § 1941.1' },
        { id: 'h4', category: 'Pest', issue_name: 'Roach Infestation', repair_clock_hours: 72, legal_citation: 'CA Civil Code § 1941.1' },
        { id: 'h5', category: 'Electrical', issue_name: 'No electricity / exposed wiring', repair_clock_hours: 24, legal_citation: 'CA Civil Code § 1941.1' },
        { id: 'h6', category: 'Security', issue_name: 'Broken locks/doors', repair_clock_hours: 24, legal_citation: 'CA Civil Code § 1941.1' },
        { id: 'h7', category: 'Mold/Mildew', issue_name: 'Severe mold or dampness', repair_clock_hours: 72, legal_citation: 'CA Civil Code § 1941.1' },
        { id: 'h8', category: 'Other', issue_name: 'Other habitability issue', repair_clock_hours: 72, legal_citation: 'CA Civil Code § 1941.1' }
      ] as any[];

  // Group rules by category
  const categories = Array.from(new Set(rulesToUse.map(r => r.category)));

  const [formData, setFormData] = useState({
    categoryId: '',
    subIssueId: '',
    unitReported: '',
    description: '',
    dateStarted: new Date().toISOString().split('T')[0],
    noticeGiven: false,
    dateNotified: new Date().toISOString().split('T')[0],
    managementMethod: 'Verbal'
  });

  // DEBUG: This log proves the component is actually receiving the signal to open
  useEffect(() => {
    if (isOpen) {
      console.log("✅ ReportIssueForm is OPEN and Rendering!");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error("No user found");

      if (!user.id || user.id === 'u1') {
        alert("Error: User session not fully loaded. Please wait a moment or try logging in again.");
        setLoading(false);
        return;
      }

      // 1. Format Date
      // If notice was already given, use the specific date they notified management.
      // If notice was not given (meaning this UI is what will generate the notice), start the clock right now.
      const reportedDateToUse = formData.noticeGiven 
        ? new Date(formData.dateNotified).toISOString() 
        : new Date().toISOString();
        
      const formattedDateForFrontend = new Date(formData.dateStarted).toISOString().split('T')[0];

      // 2. Map to Supabase Schema
      const selectedRule = rulesToUse.find(r => r.id === formData.subIssueId);
      
      const formattedCategory = `${formData.categoryId} - ${selectedRule?.issue_name || ''}`;

      const { data: record, error: sbError } = await supabase
        .from('issues')
        .insert({
          category: formattedCategory,
          rule_id: formData.subIssueId,
          description: `Issue began on ${formData.dateStarted}:\n\n${formData.description}`,
          date_reported: reportedDateToUse,
          management_method: formData.noticeGiven ? formData.managementMethod.toLowerCase().replace(' ', '_') : null,
          status: 'reported',
          unit_reported: formData.unitReported || user.unit || 'Unknown'
        })
        .select()
        .single();

      if (sbError) throw sbError;

      // Update local state in Dashboard if callback provided
      if (onSubmit) {
        onSubmit({
          id: record.id,
          category: formattedCategory,
          description: formData.description,
          dateStarted: formattedDateForFrontend,
          hasGivenNotice: formData.noticeGiven,
          status: 'Reported'
        });
      }

      // 4. Success
      await fetchIssues();
      onSuccess(record.id, wantsLegalNotice);
      onClose();

    } catch (err: any) {
      console.error("Submission Error:", err);
      const msg = err.primaryError ? JSON.stringify(err.primaryError) : err.message;
      setError(`Failed to report: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between mb-4 items-center">
          <h2 className="text-xl font-bold text-gray-800">Report New Issue</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 flex items-start text-sm border border-red-100 shadow-sm">
            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <span className="break-words font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Where is this issue located?</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, unitReported: user.unit || 'Unknown' })}
                className={`py-2 px-3 flex flex-col items-center justify-center rounded-xl border-2 font-bold text-sm transition-all ${
                  formData.unitReported === (user.unit || 'Unknown') 
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
                }`}
              >
                <span>Primary Unit</span>
                <span className="block text-xs font-medium opacity-70">({user.unit || 'Unknown'})</span>
              </button>

              {user.temporaryUnit && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, unitReported: user.temporaryUnit! })}
                  className={`py-2 px-3 flex flex-col items-center justify-center rounded-xl border-2 font-bold text-sm transition-all ${
                    formData.unitReported === user.temporaryUnit 
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Temp Unit</span>
                  </div>
                  <span className="block text-xs font-medium opacity-70">({user.temporaryUnit})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setFormData({ ...formData, unitReported: 'Community Area' })}
                className={`py-2 px-3 flex flex-col items-center justify-center rounded-xl border-2 font-bold text-sm transition-all ${
                  formData.unitReported === 'Community Area' 
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
                }`}
              >
                <span>Community Area</span>
                <span className="block text-xs font-medium opacity-70">(Shared Space)</span>
              </button>
            </div>
            {/* Hidden required input to maintain form validation */}
            <input type="hidden" required value={formData.unitReported} />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Issue Category</label>
            <select
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium"
              value={formData.categoryId}
              onChange={e => setFormData({ ...formData, categoryId: e.target.value, subIssueId: '' })}
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {formData.categoryId && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-bold text-gray-700 mb-1">Specific Issue</label>
              <select
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-indigo-50 font-medium"
                value={formData.subIssueId}
                onChange={e => setFormData({ ...formData, subIssueId: e.target.value })}
              >
                <option value="">-- Select Specific Issue --</option>
                {rulesToUse.filter(r => r.category === formData.categoryId).map(rule => (
                  <option key={rule.id} value={rule.id}>
                    {rule.issue_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea
              required
              className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 resize-none"
              placeholder="Describe the problem in detail..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">When did it start?</label>
            <input
              type="date"
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium"
              value={formData.dateStarted}
              onChange={e => setFormData({ ...formData, dateStarted: e.target.value })}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label className="flex items-center space-x-2 font-bold text-gray-800 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded bg-white"
                checked={formData.noticeGiven}
                onChange={e => setFormData({ ...formData, noticeGiven: e.target.checked })}
              />
              <span className="group-hover:text-blue-600 transition-colors uppercase text-xs tracking-tight">Has management been notified?</span>
            </label>

            {formData.noticeGiven && (
              <div className="mt-3 ml-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">How did you tell them?</label>
                  <select
                    className="w-full p-2 border rounded text-sm bg-white font-medium"
                    value={formData.managementMethod}
                    onChange={e => setFormData({ ...formData, managementMethod: e.target.value })}
                  >
                    <option value="Verbal">Verbal (Spoken)</option>
                    <option value="Phone">Phone Call</option>
                    <option value="Written Request">Written Request / Email</option>
                    <option value="Work Order">Submitted Work Order to Staff</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">When did you notify them?</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2 border rounded text-sm bg-white font-medium"
                    value={formData.dateNotified}
                    onChange={e => setFormData({ ...formData, dateNotified: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start space-x-3 mt-4">
              <CheckCircle className="text-indigo-600 flex-shrink-0 mt-0.5" size={18} />
              <label className="flex items-start space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-indigo-600 rounded"
                  checked={wantsLegalNotice}
                  onChange={e => setWantsLegalNotice(e.target.checked)}
                />
                <div>
                  <span className="block text-[10px] font-black text-indigo-900 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Generate Formal Notice?</span>
                  <span className="block text-xs text-indigo-800/70 font-medium leading-tight mt-1">
                    I want to create a legal PDF demand letter immediately after reporting this.
                  </span>
                </div>
              </label>
            </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e3a8a] text-white p-3 rounded-xl font-black uppercase tracking-widest hover:bg-blue-900 disabled:opacity-50 transition-all shadow-md active:scale-[0.98] h-12"
          >
            {loading ? 'Submitting...' : 'Report Issue'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- DUAL EXPORT SAFETY NET ---
export { ReportIssueForm };
export default ReportIssueForm;
