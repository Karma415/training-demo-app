import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

export interface JargonTerm {
  id: string;
  term: string;
  definition: string;
  created_at?: string;
}

export const useAdminJargonDictionary = () => {
  const [terms, setTerms] = useState<JargonTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTerm, setCurrentTerm] = useState<Partial<JargonTerm>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jargon_terms')
        .select('*')
        .order('term', { ascending: true });

      if (error) throw error;
      setTerms(data || []);
    } catch (err: any) {
      console.error('Failed to load jargon terms:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const filteredTerms = useMemo(() => {
    return terms.filter(term =>
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [terms, searchTerm]);

  const updateCurrentTerm = (updates: Partial<JargonTerm>) => {
    setCurrentTerm(prev => ({ ...prev, ...updates }));
  };

  const startNewTerm = () => {
    setCurrentTerm({});
    setIsEditing(true);
    setError(null);
  };

  const startEditTerm = (term: JargonTerm) => {
    setCurrentTerm(term);
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setCurrentTerm({});
    setError(null);
  };

  const handleSave = async () => {
    if (!currentTerm.term?.trim() || !currentTerm.definition?.trim()) {
      setError('Term and definition are required.');
      return;
    }

    try {
      setSaveLoading(true);
      setError(null);

      if (currentTerm.id) {
        const { error } = await supabase
          .from('jargon_terms')
          .update({
            term: currentTerm.term,
            definition: currentTerm.definition,
          })
          .eq('id', currentTerm.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('jargon_terms')
          .insert({
            term: currentTerm.term,
            definition: currentTerm.definition,
          });

        if (error) throw error;
      }

      cancelEditing();
      fetchTerms();
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this term?')) return;

    try {
      const { error } = await supabase.from('jargon_terms').delete().eq('id', id);
      if (error) throw error;
      fetchTerms();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete term.');
    }
  };

  return {
    terms,
    filteredTerms,
    loading,
    searchTerm,
    setSearchTerm,
    isEditing,
    currentTerm,
    saveLoading,
    error,
    updateCurrentTerm,
    startNewTerm,
    startEditTerm,
    cancelEditing,
    handleSave,
    handleDelete,
  };
};
