type EvidenceMetadata = {
  thumbnail_url?: string | null;
  google_drive_file_id?: string | null;
  drive_file_id?: string | null;
};

type EvidenceFileLike = {
  file_path?: string | null;
  metadata?: EvidenceMetadata | null;
};

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
