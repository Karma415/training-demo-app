import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';

interface UseHelpVideoResult {
  videoUrl: string | null;
  embedUrl: string | null;
  isOpen: boolean;
  openVideo: () => void;
  closeVideo: () => void;
}

const getEmbedUrl = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
  }

  return url;
};

export const useHelpVideo = (pagePath: string): UseHelpVideoResult => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchVideo = async () => {
      try {
        const { data, error } = await supabase
          .from('page_tutorials')
          .select('video_url')
          .eq('page_path', pagePath)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error('Error fetching page tutorial:', error);
          setVideoUrl(null);
          return;
        }

        setVideoUrl(data?.video_url ?? null);
      } catch (error) {
        if (!isMounted) return;
        console.error('Unexpected error fetching page tutorial:', error);
        setVideoUrl(null);
      }
    };

    fetchVideo();

    return () => {
      isMounted = false;
    };
  }, [pagePath]);

  const embedUrl = useMemo(() => {
    return videoUrl ? getEmbedUrl(videoUrl) : null;
  }, [videoUrl]);

  return {
    videoUrl,
    embedUrl,
    isOpen,
    openVideo: () => setIsOpen(true),
    closeVideo: () => setIsOpen(false),
  };
};
