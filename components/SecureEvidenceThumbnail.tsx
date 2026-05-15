import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { fetchSecureEvidenceBlob } from '../utils/evidenceFiles';

interface SecureEvidenceThumbnailProps {
  evidenceId?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

const SecureEvidenceThumbnail: React.FC<SecureEvidenceThumbnailProps> = ({
  evidenceId,
  alt,
  className,
  fallback
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let nextObjectUrl: string | null = null;

    const loadThumbnail = async () => {
      if (!evidenceId) return;

      try {
        const blob = await fetchSecureEvidenceBlob(evidenceId, 'thumbnail');
        nextObjectUrl = URL.createObjectURL(blob);
        if (isMounted) setObjectUrl(nextObjectUrl);
      } catch (error) {
        console.error('Failed to load evidence thumbnail:', error);
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [evidenceId]);

  if (objectUrl) {
    return <img src={objectUrl} alt={alt} className={className} />;
  }

  return (
    <>
      {fallback || (
        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
          <FileText className="w-12 h-12" />
        </div>
      )}
    </>
  );
};

export default SecureEvidenceThumbnail;
