import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface UniversityArticle {
  id: string;
  title: string;
  content: string;
  author_name?: string;
  published_at?: string;
  created_at: string;
}

export const useAdminArticles = () => {
  const [articles, setArticles] = useState<UniversityArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<UniversityArticle>>({});

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('university_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const updateFormData = (updates: Partial<UniversityArticle>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleEdit = (article: UniversityArticle) => {
    setIsEditing(article.id);
    setFormData(article);
  };

  const handleCreateNew = () => {
    setIsEditing('new');
    setFormData({
      title: '',
      content: '',
      author_name: 'SF Housing Hub Admin',
      published_at: new Date().toISOString(),
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
        const { error } = await supabase.from('university_articles').insert([formData]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('university_articles')
          .update(formData)
          .eq('id', isEditing);
        if (error) throw error;
      }

      handleCancel();
      await fetchArticles();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save article.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    try {
      const { error } = await supabase.from('university_articles').delete().eq('id', id);
      if (error) throw error;
      await fetchArticles();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete article.');
    }
  };

  return {
    articles,
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
