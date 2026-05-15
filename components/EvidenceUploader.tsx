import React, { useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { Upload, CheckCircle2, AlertCircle, Loader2, FolderPlus } from 'lucide-react';
import EXIF from 'exif-js';
import { getGoogleDriveThumbnailUrl } from '../utils/evidenceFiles';

interface EvidenceUploaderProps {
  issueId: string;
  tenantId: string;
  onUploadSuccess?: (url: string) => void;
}

const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ issueId, tenantId, onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const compressImage = (file: File, maxWidth = 1600, quality = 0.75): Promise<File | Blob> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.type.includes('gif')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Return a new file with the original name but compressed
                resolve(new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }));
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setStatus('idle');
    setErrorMessage(null);

    const uploadPromises = Array.from(files).map(async (originalFile) => {
      try {
        // 1. Extract EXIF Data before compression (to keep original metadata)
        let metadata: any = null;
        if (originalFile.type.startsWith('image/')) {
          try {
            metadata = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = function(e) {
                try {
                  if (!e.target?.result) {
                    resolve(null);
                    return;
                  }
                  const exifData = (EXIF as any).readFromBinaryFile(e.target.result);
                  if (exifData && Object.keys(exifData).length > 0) {
                    let lat = null, lng = null;
                    if (exifData.GPSLatitude && exifData.GPSLatitudeRef) {
                      const degrees = exifData.GPSLatitude[0]?.numerator / (exifData.GPSLatitude[0]?.denominator || 1);
                      const minutes = exifData.GPSLatitude[1]?.numerator / (exifData.GPSLatitude[1]?.denominator || 1);
                      const seconds = exifData.GPSLatitude[2]?.numerator / (exifData.GPSLatitude[2]?.denominator || 1);
                      lat = degrees + (minutes / 60) + (seconds / 3600);
                      if (exifData.GPSLatitudeRef === 'S') lat = -lat;
                    }
                    if (exifData.GPSLongitude && exifData.GPSLongitudeRef) {
                      const degrees = exifData.GPSLongitude[0]?.numerator / (exifData.GPSLongitude[0]?.denominator || 1);
                      const minutes = exifData.GPSLongitude[1]?.numerator / (exifData.GPSLongitude[1]?.denominator || 1);
                      const seconds = exifData.GPSLongitude[2]?.numerator / (exifData.GPSLongitude[2]?.denominator || 1);
                      lng = degrees + (minutes / 60) + (seconds / 3600);
                      if (exifData.GPSLongitudeRef === 'W') lng = -lng;
                    }
                    
                    resolve({
                      timestamp: exifData.DateTimeOriginal || null,
                      latitude: lat,
                      longitude: lng,
                      cameraMake: exifData.Make || null,
                      cameraModel: exifData.Model || null
                    });
                  } else {
                    resolve(null);
                  }
                } catch (err) {
                  resolve(null);
                }
              };
              reader.onerror = () => resolve(null);
              reader.readAsArrayBuffer(originalFile);
            });
          } catch (exifErr) {
            console.warn("Failed to extract EXIF metadata:", exifErr);
          }
        }

        // 2. Compress if it's an image
        const fileToUpload = await compressImage(originalFile);

        // 3. Upload to Google Drive via Edge Function. Do not store raw base64 in Supabase if this fails.
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('filename', originalFile.name);

        const { data, error: uploadError } = await supabase.functions.invoke('upload-to-google', {
          body: formData,
        });

        if (uploadError) throw uploadError;
        if (!data || !data.success || !data.webViewLink) {
          throw new Error(data?.error || "Google Drive upload failed.");
        }

        const uploadedUrl = data.webViewLink;
        const verifiedThumbnail = data.thumbnailLink || getGoogleDriveThumbnailUrl(data.id);

        // 4. Insert Database Record
        const safeMetadata = metadata || {};

        const { error: dbError } = await supabase
          .from('evidence_files')
          .insert({
            issue_id: issueId,
            tenant_id: tenantId,
            file_path: uploadedUrl,
            metadata: {
              ...safeMetadata,
              thumbnail_url: verifiedThumbnail,
              google_drive_file_id: data.id,
              file_mime_type: originalFile.type,
              filename: originalFile.name
            }
          });

        if (dbError) throw dbError;
        
        return uploadedUrl;
      } catch (err: any) {
        console.error(`Upload error for ${originalFile.name}:`, err);
        throw err;
      }
    });

    try {
      await Promise.all(uploadPromises);
      setStatus('success');
      if (onUploadSuccess) onUploadSuccess('multiple');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || "Failed to upload one or more files");
    } finally {
      setUploading(false);
      // Clear input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 mb-8 overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center space-y-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
          status === 'success' ? 'bg-emerald-100 text-emerald-600 scale-110' :
          status === 'error' ? 'bg-rose-100 text-rose-600' :
          'bg-blue-50 text-blue-600'
        }`}>
          {uploading ? <Loader2 className="w-10 h-10 animate-spin" /> :
           status === 'success' ? <CheckCircle2 className="w-10 h-10" /> :
           status === 'error' ? <AlertCircle className="w-10 h-10" /> :
           <FolderPlus className="w-10 h-10" />}
        </div>

        <div className="text-center">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            {status === 'success' ? 'Upload Successful!' : 
             status === 'error' ? 'Upload Failed' :
             'Add Supporting Documents and Photos'}
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            {uploading ? 'Processing & Vaulting...' : 'Secure Storage for SF Housing Hub'}
          </p>
        </div>

        <input
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`w-full max-w-xs py-4 px-8 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 shadow-lg active:scale-95 ${
            uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
            status === 'success' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
            'bg-[#1e3a8a] text-white hover:bg-blue-900 shadow-blue-900/20'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span>{uploading ? 'Uploading...' : status === 'success' ? 'Add Another' : 'Upload Documents, Photos & Videos'}</span>
        </button>

        {errorMessage && (
          <p className="text-xs font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-lg border border-rose-100 animate-in slide-in-from-top-2">
            Error: {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default EvidenceUploader;
