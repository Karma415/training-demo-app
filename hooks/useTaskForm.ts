import { useState } from 'react';
import type { FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';

interface UseTaskFormOptions {
  onClose: () => void;
  onSuccess: (task: any) => void;
}

interface TaskFormData {
  description: string;
  dueDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  location: string;
}

const getDefaultFormData = (): TaskFormData => ({
  description: '',
  dueDate: new Date().toISOString().split('T')[0],
  endDate: '',
  startTime: '',
  endTime: '',
  meetingLink: '',
  location: '',
});

export const useTaskForm = ({ onClose, onSuccess }: UseTaskFormOptions) => {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<TaskFormData>(getDefaultFormData);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFormData = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAdvanced = () => {
    setShowAdvanced(prev => !prev);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user?.id || user.id === '' || user.id === 'u1') {
        throw new Error('User session not fully loaded. Please wait a moment.');
      }

      const { data, error: sbError } = await supabase
        .from('tasks')
        .insert({
          tenant_id: user.id,
          description: formData.description,
          due_date: formData.dueDate || null,
          end_date: formData.endDate || null,
          start_time: formData.startTime || null,
          end_time: formData.endTime || null,
          meeting_link: formData.meetingLink || null,
          location: formData.location || null,
          status: 'to_do',
          completed: false,
        })
        .select()
        .single();

      if (sbError) throw sbError;

      onSuccess(data);
      onClose();
      setFormData(getDefaultFormData());
      setShowAdvanced(false);
    } catch (err: any) {
      console.error('Task Creation Error:', err);
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    formData,
    showAdvanced,
    updateFormData,
    toggleAdvanced,
    handleSubmit,
  };
};
