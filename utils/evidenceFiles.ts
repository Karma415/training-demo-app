import { supabase } from '../services/supabase';

type EvidenceMetadata = {
  thumbnail_url?: string | null;
  google_drive_file_id?: string | null;
  drive_file_id?: string | null;
};

type EvidenceFileLike = {
  id?: string | null;
  file_path?: string | null;
  metadata?: EvidenceMetadata | null;
};

export type EvidenceVariant = 'file' | 'thumbnail';

export const getGoogleDriveFileId = (url?: string | null): string | null => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const idFromQuery = parsedUrl.searchParams.get('id');
    if (idFromQuery) return idFromQuery;
  } catch {
    // Fall through to regex extraction for stored paths that are not valid URLs.
  }

  const match = url.match(/\/(?:file|document|spreadsheets|presentation)\/d\/([^/?#]+)/);
  return match?.[1] || null;
};

export const getGoogleDriveThumbnailUrl = (fileId?: string | null, size = 800): string | null => {
  if (!fileId) return null;
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${size}`;
};

export const getEvidenceThumbnailUrl = (file: EvidenceFileLike, size = 800): string | null => {
  const existingThumbnail = file.metadata?.thumbnail_url;
  if (existingThumbnail && !existingThumbnail.startsWith('data:')) return existingThumbnail;

  const driveFileId =
    file.metadata?.google_drive_file_id ||
    file.metadata?.drive_file_id ||
    getGoogleDriveFileId(file.file_path);

  return getGoogleDriveThumbnailUrl(driveFileId, size);
};

export const getSecureEvidenceUrl = (evidenceId: string, variant: EvidenceVariant = 'file'): string => {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  return `${supabaseUrl}/functions/v1/view-evidence?evidence_id=${encodeURIComponent(evidenceId)}&variant=${variant}`;
};

export const fetchSecureEvidenceBlob = async (
  evidenceId: string,
  variant: EvidenceVariant = 'file'
): Promise<Blob> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('You must be signed in to view evidence.');
  }

  const response = await fetch(getSecureEvidenceUrl(evidenceId, variant), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load evidence (${response.status}).`);
  }

  return response.blob();
};

export const openSecureEvidence = async (file: EvidenceFileLike): Promise<void> => {
  if (!file.id) {
    throw new Error('Missing evidence id.');
  }

  const targetWindow = window.open('about:blank', '_blank');
  if (!targetWindow) {
    throw new Error('Pop-up blocked. Please allow pop-ups to view evidence.');
  }

  const blob = await fetchSecureEvidenceBlob(file.id, 'file');
  const objectUrl = URL.createObjectURL(blob);

  targetWindow.location.href = objectUrl;
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
};
