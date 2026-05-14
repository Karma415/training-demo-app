import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';

interface HistoricalDataFormProps {
  onAddEntry: (entry: any) => void;
  directSubmitToSupabase?: boolean;
}

export const HistoricalDataForm: React.FC<HistoricalDataFormProps> = ({ onAddEntry, directSubmitToSupabase = false }) => {
  const { user, habitabilityRules } = useApp();
  const [loading, setLoading] = useState(false);
  
  const [dataType, setDataType] = useState('Issue'); // Issue, Document, Interaction, Other
  const [subIssueId, setSubIssueId] = useState('');
  const [description, setDescription] = useState('');
  const [dateStarted, setDateStarted] = useState(new Date().toISOString().split('T')[0]);
  const [ongoing, setOngoing] = useState(false);
  const [peopleInvolved, setPeopleInvolved] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate if it's older than 7 days
    const eventDate = new Date(dateStarted);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - eventDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isHistorical = diffDays > 7;

    let finalCategory = '';
    if (dataType === 'Issue') {
      const selectedRule = habitabilityRules.find(r => r.id === subIssueId);
      finalCategory = selectedRule ? `${selectedRule.category} - ${selectedRule.issue_name}` : 'Issue';
    } else {
      finalCategory = dataType;
    }

    if (isHistorical) {
      finalCategory = `Historical - ${finalCategory}`;
    }

    let finalDescription = description;
    if (peopleInvolved) finalDescription += `\nPeople Involved: ${peopleInvolved}`;
    if (location) finalDescription += `\nLocation: ${location}`;

    if (isHistorical) {
      finalDescription += `\n\n[HISTORICAL ENTRY] Information in this section was entered seven days or more after the event occurred. It is separated because it may not be as accurate due to the time lapse between the event and logging the data.`;
    }

    const payload = {
      category: [finalCategory],
      issue_category_id: dataType === 'Issue' ? subIssueId : null,
      description: finalDescription,
      date_reported: dateStarted, // event date
      status: ongoing ? 'reported' : 'resolved',
      management_method: null,
      escalation_level: 0,
    };

    if (directSubmitToSupabase) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('issues')
          .insert({
            ...payload,
            tenant_id: user.id
          });
        if (error) throw error;
        onAddEntry(payload); // callback on success
        alert('Historical entry added successfully!');
        // Reset form
        setDescription('');
        setPeopleInvolved('');
        setLocation('');
      } catch (err) {
        console.error("Error submitting historical data:", err);
        alert('Failed to submit entry.');
      } finally {
        setLoading(false);
      }
    } else {
      onAddEntry(payload);
      // Reset form
      setDescription('');
      setPeopleInvolved('');
      setLocation('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Log Past Event / Information</h3>
      <p className="text-sm text-gray-500 mb-6">Use this form to log any previous issues, interactions with staff, or documents.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">What type of information are you logging?</label>
          <select 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
          >
            <option value="Issue">Previous or Current Issue (Habitability)</option>
            <option value="Interaction">Staff Interaction</option>
            <option value="Document">Document</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {dataType === 'Issue' && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-3">
             <label className="block text-sm font-bold text-blue-900">Select Specific Issue</label>
              <select
                required
                className="w-full p-2 border border-blue-200 rounded focus:ring-2 mt-1 focus:ring-blue-500 outline-none bg-white font-medium"
                value={subIssueId}
                onChange={e => setSubIssueId(e.target.value)}
              >
                <option value="">-- Select Issue --</option>
                {habitabilityRules && habitabilityRules.length > 0 ? habitabilityRules.map(rule => (
                  <option key={rule.id} value={rule.id}>
                    {rule.category} - {rule.issue_name}
                  </option>
                )) : (
                  <>
                    <option value="plumbing_leak">Plumbing - Leak / No Water</option>
                    <option value="heating_none">Heating - No Heat</option>
                    <option value="electrical_outage">Electrical - Outage / Sparks</option>
                    <option value="pests_roaches">Pests - Roaches / Rodents</option>
                    <option value="security_lock">Security - Broken Lock</option>
                    <option value="structural_damage">Structural - Hole in Wall / Ceiling</option>
                    <option value="mold">Environmental - Mold / Mildew</option>
                    <option value="appliance_broken">Appliances - Broken Stove / Fridge</option>
                    <option value="other">Other - General Maintenance</option>
                  </>
                )}
              </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Date of Event</label>
          <input
            type="date"
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            value={dateStarted}
            onChange={e => setDateStarted(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Is this issue still ongoing?</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input type="radio" className="form-radio text-blue-600" checked={!ongoing} onChange={() => setOngoing(false)} />
              <span className="ml-2">No, it is finalized/resolved</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" className="form-radio text-blue-600" checked={ongoing} onChange={() => setOngoing(true)} />
              <span className="ml-2">Yes, it is ongoing</span>
            </label>
          </div>
        </div>

        {dataType === 'Other' && (
          <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200">
            <strong>Please remember:</strong> Always list any dates that are related to the information you are entering, any people who were involved or notified, any locations, and upload documentation if available.
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Description / Details</label>
          <textarea
            required
            className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 resize-none"
            placeholder="Describe the event, document, or interaction..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">People Involved / Notified</label>
            <input
              type="text"
              className="w-full p-2 border rounded outline-none bg-gray-50"
              placeholder="(Optional)"
              value={peopleInvolved}
              onChange={e => setPeopleInvolved(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
            <input
              type="text"
              className="w-full p-2 border rounded outline-none bg-gray-50"
              placeholder="(Optional)"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1e3a8a] text-white font-bold rounded-lg mt-4 disabled:opacity-50 hover:bg-blue-900 transition-colors"
        >
          {loading ? 'Saving...' : directSubmitToSupabase ? 'Submit Entry' : 'Add to Onboarding Profile'}
        </button>
      </form>

      {directSubmitToSupabase && (
         <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-bold text-gray-700 mb-2">Upload Associated Documentation (Must Save Entry First)</h4>
            <p className="text-xs text-gray-500 mb-2">If you have photos or documents, you must upload them from the specific issue page after it is saved.</p>
         </div>
      )}
    </div>
  );
};

export default HistoricalDataForm;
