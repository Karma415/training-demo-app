import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface ResourceByCategory {
  id: string;
  name: string;
  specialty?: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  examples?: string;
}

interface UseResourcesByCategoryResult {
  resources: ResourceByCategory[];
  isLoading: boolean;
  error: string | null;
}

export const useResourcesByCategory = (category: string): UseResourcesByCategoryResult => {
  const [resources, setResources] = useState<ResourceByCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchResources = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .eq('category', category)
          .eq('is_active', true)
          .order('name');

        if (resourcesError) throw resourcesError;
        if (!isMounted) return;

        setResources(data ?? []);
      } catch (err: any) {
        if (!isMounted) return;

        console.error(`Failed to load ${category} resources:`, err);
        setError(err.message || 'Failed to load resources');
        setResources([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchResources();

    return () => {
      isMounted = false;
    };
  }, [category]);

  return { resources, isLoading, error };
};
