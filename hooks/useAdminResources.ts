import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface ResourceRecord {
  id: string;
  category: string;
  name: string;
  specialty?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  examples?: string;
  is_active: boolean;
}

export const useAdminResources = () => {
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ResourceRecord>>({});

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('resources').select('*').order('name');
      if (error) throw error;
      if (data) setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const updateFormData = (updates: Partial<ResourceRecord>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleEdit = (resource: ResourceRecord) => {
    setIsEditing(resource.id);
    setFormData(resource);
  };

  const handleCreateNew = () => {
    setIsEditing('new');
    setFormData({
      category: 'Aid',
      name: '',
      is_active: true,
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!isEditing) return;

    try {
      if (isEditing === 'new') {
        const { error } = await supabase.from('resources').insert([formData]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('resources').update(formData).eq('id', isEditing);
        if (error) throw error;
      }

      handleCancel();
      await fetchResources();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save resource.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      await fetchResources();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete resource.');
    }
  };

  return {
    resources,
    loading,
    isEditing,
    formData,
    updateFormData,
    handleEdit,
    handleCreateNew,
    handleCancel,
    handleSave,
    handleDelete,
  };
};
