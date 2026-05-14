import { useState } from 'react';
import { supabase } from '../services/supabase';

interface UseTimeTravelIssuesResult {
  loading: boolean;
  handleTimeTravel: () => Promise<void>;
}

export const useTimeTravelIssues = (): UseTimeTravelIssuesResult => {
  const [loading, setLoading] = useState(false);

  const handleTimeTravel = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('No authenticated user found.');
        return;
      }

      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('issues')
        .update({ created_at: tenDaysAgo })
        .eq('tenant_id', user.id);

      if (error) {
        console.error('Error updating issues:', error);
        alert('Failed to time travel: ' + error.message);
      } else {
        alert('Time travel complete! All issues are now expired.');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during time travel.');
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleTimeTravel };
};
