import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { FolderOpen, Plus, FileText, Image as ImageIcon, Receipt, Search, Filter, Loader2, Calendar, DollarSign, Eye, Upload } from 'lucide-react';
import { getGoogleDriveThumbnailUrl, openSecureEvidence } from '../utils/evidenceFiles';
import SecureEvidenceThumbnail from '../components/SecureEvidenceThumbnail';

interface EvidenceRecord {
  id: string;
  file_path: string;
  uploaded_at: string;
  metadata: {
    record_type?: 'document' | 'receipt' | 'photograph';
    description?: string;
    cost_amount?: number;
    date_received_or_taken?: string;
    is_date_approximate?: boolean;
    thumbnail_url?: string;
    filename?: string;
  };
  tenants?: {
    first_name?: string | null;
    last_name?: string | null;
    unit_number?: number | string | null;
  } | null;
}

const RecordsLibrary: React.FC = () => {
  const { user: authUser } = useAuth();
  const { user: appUser, tenants } = useApp();
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'document' | 'receipt' | 'photograph'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Uploader State
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'document' | 'receipt' | 'photograph'>('document');
  const [uploadData, setUploadData] = useState({
    description: '',
    cost_amount: '',
    date_received_or_taken: '',
    is_date_approximate: false
  });
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const isSuperAdmin = appUser.role === 'superadmin';
  const uploadTargetTenantId = isSuperAdmin ? selectedTenantId : authUser?.id;
  const tenantOptions = tenants
    .filter((tenant: any) => !['admin', 'superadmin', 'legal_counsel'].includes(tenant.role || ''))
    .sort((a: any, b: any) => {
      const unitA = String(a.unit || a.unit_number || '');
      const unitB = String(b.unit || b.unit_number || '');
      return unitA.localeCompare(unitB, undefined, { numeric: true });
    });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      if (!authUser?.id) return;

      const isPrivilegedRecordsView = ['legal_counsel', 'admin', 'superadmin'].includes(appUser.role || '');

      let query = supabase
        .from('evidence_files')
        .select(`
          *,
          issues(date_reported),
          tenants(first_name, last_name, unit_number)
        `)
        .order('uploaded_at', { ascending: false });

      if (!isPrivilegedRecordsView) {
        query = query.eq('tenant_id', authUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [authUser?.id, appUser.role]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (selectedTenantId) return;

    const firstTenant = tenantOptions[0];
    if (firstTenant?.id) {
      setSelectedTenantId(firstTenant.id);
    }
  }, [isSuperAdmin, selectedTenantId, tenantOptions]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !authUser?.id || !uploadTargetTenantId) return;
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filename', selectedFile.name);

      const { data: uploadResult, error: uploadError } = await supabase.functions.invoke('upload-to-google', {
        body: formData,
      });

      if (uploadError) throw uploadError;
      if (!uploadResult || !uploadResult.success || !uploadResult.webViewLink) {
        throw new Error(uploadResult?.error || 'Google Drive upload failed.');
      }

      const newMetadata = {
        record_type: uploadType,
        description: uploadData.description,
        cost_amount: uploadType === 'receipt' ? parseFloat(uploadData.cost_amount) : undefined,
        date_received_or_taken: uploadData.date_received_or_taken,
        is_date_approximate: uploadData.is_date_approximate,
        thumbnail_url: uploadResult.thumbnailLink || getGoogleDriveThumbnailUrl(uploadResult.id) || undefined,
        google_drive_file_id: uploadResult.id,
        file_mime_type: selectedFile.type,
        filename: selectedFile.name
      };

      const { error } = await supabase.from('evidence_files').insert({
        tenant_id: uploadTargetTenantId,
        issue_id: null, // Standalone record
        file_path: uploadResult.webViewLink,
        metadata: newMetadata
      });

      if (error) throw error;
      
      await fetchRecords();
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({
        description: '',
        cost_amount: '',
        date_received_or_taken: '',
        is_date_approximate: false
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const recordType = r.metadata?.record_type || ((r as any).issue_id ? 'evidence' : 'document');
    // For filtering purposes, group 'evidence' under 'document' if they want, or just let 'all' catch it.
    const matchesFilter = filter === 'all' || recordType === filter || (filter === 'document' && recordType === 'evidence');
    const desc = r.metadata?.description || r.metadata?.filename || 'Evidence File';
    const matchesSearch = desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalReceiptCost = records
    .filter(r => r.metadata?.record_type === 'receipt' && r.metadata?.cost_amount)
    .reduce((sum, r) => sum + (r.metadata?.cost_amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in zoom-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight flex items-center">
            <FolderOpen className="w-10 h-10 mr-4 text-blue-600" />
            Records Library
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-2">
            Securely store and manage your standalone documents, receipts, and photographs.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-[#1e3a8a] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Record</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-3">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
              {['all', 'document', 'receipt', 'photograph'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type as any)}
                  className={`px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
                    filter === type 
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-200' 
                      : 'bg-white text-slate-600 border-2 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Total Receipt Costs</p>
          <p className="text-3xl font-black text-emerald-900">${totalReceiptCost.toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-blue-300 animate-spin" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <FolderOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600 mb-2">No Records Found</h3>
          <p className="text-slate-400">Upload your first document, receipt, or photograph to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecords.map(record => (
            <div key={record.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group">
              <div className="h-48 bg-slate-100 relative border-b border-slate-100 overflow-hidden">
                <SecureEvidenceThumbnail
                  evidenceId={record.id}
                  alt={record.metadata?.filename || 'Evidence thumbnail'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  fallback={
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      {record.metadata?.record_type === 'document' && <FileText className="w-16 h-16" />}
                      {record.metadata?.record_type === 'receipt' && <Receipt className="w-16 h-16" />}
                      {record.metadata?.record_type === 'photograph' && <ImageIcon className="w-16 h-16" />}
                    </div>
                  }
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black text-slate-700 shadow-sm flex items-center space-x-1">
                  {(record.metadata?.record_type === 'document' || !record.metadata?.record_type) && <FileText className="w-3 h-3 text-blue-500" />}
                  {record.metadata?.record_type === 'receipt' && <Receipt className="w-3 h-3 text-emerald-500" />}
                  {record.metadata?.record_type === 'photograph' && <ImageIcon className="w-3 h-3 text-amber-500" />}
                  <span className="uppercase">{record.metadata?.record_type || 'Evidence'}</span>
                </div>
                {record.metadata?.cost_amount && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm flex items-center">
                    <DollarSign className="w-3 h-3 mr-0.5" />
                    {record.metadata.cost_amount.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="p-5">
                {['legal_counsel', 'admin', 'superadmin'].includes(appUser.role || '') && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">
                    {`${record.tenants?.first_name || ''} ${record.tenants?.last_name || ''}`.trim() || 'Unknown tenant'}
                    {record.tenants?.unit_number ? ` • Unit ${record.tenants.unit_number}` : ''}
                  </p>
                )}
                <p className="font-bold text-slate-800 line-clamp-2 min-h-[3rem] mb-3">
                  {record.metadata?.description || record.metadata?.filename || 'Issue Evidence File'}
                </p>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {(() => {
                        const rawDate = record.metadata?.date_received_or_taken || (record as any).issues?.date_reported;
                        if (rawDate) return rawDate.includes('T') ? new Date(rawDate).toLocaleDateString() : new Date(`${rawDate}T12:00:00Z`).toLocaleDateString();
                        return new Date(record.uploaded_at).toLocaleDateString();
                      })()}
                    </span>
                  </div>
                  {record.metadata?.is_date_approximate && (
                    <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider text-[9px]">Approx</span>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openSecureEvidence(record).catch(error => {
                      console.error('Failed to open evidence:', error);
                      alert('Unable to open evidence. Please try again.');
                    })}
                    className="w-full bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors py-2 rounded-lg font-bold text-xs flex justify-center items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View File
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">Add New Record</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-2 shadow-sm"><Filter className="w-5 h-5 rotate-45" /></button>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6">
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tenant Record Library</label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                  >
                    <option value="">Select a tenant</option>
                    {tenantOptions.map((tenant: any) => (
                      <option key={tenant.id} value={tenant.id}>
                        {`${tenant.firstName || tenant.first_name || ''} ${tenant.lastName || tenant.last_name || ''}`.trim() || tenant.email || 'Unknown tenant'}
                        {tenant.unit || tenant.unit_number ? ` - Unit ${tenant.unit || tenant.unit_number}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 font-semibold mt-2">
                    This upload will be saved into the selected tenant's records.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Record Type</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {['document', 'receipt', 'photograph'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setUploadType(type as any)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                        uploadType === type ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-blue-400 transition-colors"
                >
                  <Plus className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="font-bold text-slate-600">
                    {selectedFile ? selectedFile.name : 'Click to select a file'}
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Provide a brief description..."
                />
              </div>

              {uploadType === 'receipt' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cost Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={uploadData.cost_amount}
                    onChange={(e) => setUploadData({...uploadData, cost_amount: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 45.99"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {uploadType === 'document' ? 'Date Received' : uploadType === 'photograph' ? 'Date Taken' : 'Date of Purchase'}
                </label>
                <div className="flex space-x-4 items-center">
                  <input
                    type="date"
                    value={uploadData.date_received_or_taken}
                    onChange={(e) => setUploadData({...uploadData, date_received_or_taken: e.target.value})}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center space-x-2 text-sm font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={uploadData.is_date_approximate}
                      onChange={(e) => setUploadData({...uploadData, is_date_approximate: e.target.checked})}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Approximate?</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex justify-end space-x-4">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || (isSuperAdmin && !selectedTenantId)}
                className="bg-[#1e3a8a] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                <span>{isUploading ? 'Saving...' : 'Save Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecordsLibrary;
