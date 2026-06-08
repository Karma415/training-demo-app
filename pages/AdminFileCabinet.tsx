import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import QRCode from 'qrcode';

interface TenantFile {
  id: string;
  name: string;
  unit: string;
  email: string;
  items: ChecklistEntry[];
}

interface ChecklistEntry {
  id: string;
  title: string;
  description: string;
  form_url: string | null;
  status: 'pending' | 'completed';
  deadline: string | null;
  admin_read: boolean;
  sent_to_attorney: boolean;
  completed_at: string | null;
}

interface TemplateForm {
  title: string;
  description: string;
  form_url: string;
  deadline: string;
  urgency_level: string;
}

const AdminFileCabinet: React.FC = () => {
  const [tenants, setTenants] = useState<TenantFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'cabinets' | 'grid'>('cabinets');
  const [selectedTenant, setSelectedTenant] = useState<TenantFile | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState<ChecklistEntry | null>(null);
  const [forwardEmail, setForwardEmail] = useState('');
  const [forwardTenantName, setForwardTenantName] = useState('');
  const [forwardSending, setForwardSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState<TemplateForm>({ title: '', description: '', form_url: '', deadline: '', urgency_level: 'Normal' });
  const [signupCodes, setSignupCodes] = useState<any[]>([]);
  const [showCodeGen, setShowCodeGen] = useState(false);
  const [newCodeUnit, setNewCodeUnit] = useState('');

  // QR Logins State
  const [qrLogins, setQrLogins] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'invite' | 'qr'>('invite');
  const [newQrName, setNewQrName] = useState('');
  const [newQrEmail, setNewQrEmail] = useState('');
  const [newQrUnit, setNewQrUnit] = useState('');
  const [newQrPassword, setNewQrPassword] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedQrDetails, setGeneratedQrDetails] = useState<{
    name: string;
    email: string;
    link: string;
    password_plain: string;
  } | null>(null);
  const [copiedDetailsType, setCopiedDetailsType] = useState<'link' | 'pass' | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (generatedQrDetails?.link) {
      QRCode.toDataURL(generatedQrDetails.link, { width: 250, margin: 2 }, (err, url) => {
        if (err) console.error('Error generating QR code:', err);
        else setQrDataUrl(url);
      });
    } else {
      setQrDataUrl('');
    }
  }, [generatedQrDetails?.link]);


  // Tutorials & Notices State
  const [showTutorialManager, setShowTutorialManager] = useState(false);
  const [tutorialForm, setTutorialForm] = useState({ page_path: '', video_url: '' });
  const [showNoticeDistributor, setShowNoticeDistributor] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', description: '', target_type: 'all', tenant_id: '' });
  const [noticeFile, setNoticeFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploadingNotice, setIsUploadingNotice] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tenantsRes, checklistsRes, templatesRes, codesRes, qrLoginsRes] = await Promise.all([
        supabase.from('tenants').select('*').not('role', 'in', '("admin","superadmin","legal_counsel")').order('unit_number'),
        supabase.from('tenant_checklists').select('*, checklist_templates(title, description, form_url)'),
        supabase.from('checklist_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('signup_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('tenant_qr_logins').select('*, tenants(first_name, last_name, unit_number)').order('created_at', { ascending: false })
      ]);

      if (templatesRes.data) setTemplates(templatesRes.data);
      if (codesRes.data) setSignupCodes(codesRes.data);
      if (qrLoginsRes.data) setQrLogins(qrLoginsRes.data);

      const tenantList = tenantsRes.data || [];
      const checklists = checklistsRes.data || [];

      const mapped: TenantFile[] = tenantList.map((t: any) => ({
        id: t.id,
        name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.email || 'Unknown',
        unit: t.unit_number?.toString() || 'N/A',
        email: t.email || '',
        items: checklists
          .filter((c: any) => c.tenant_id === t.id)
          .map((c: any) => ({
            id: c.id,
            title: c.checklist_templates?.title || 'Unknown',
            description: c.checklist_templates?.description || '',
            form_url: c.checklist_templates?.form_url || null,
            status: c.status,
            deadline: c.deadline,
            admin_read: c.admin_read,
            sent_to_attorney: c.sent_to_attorney,
            completed_at: c.completed_at,
          })),
      }));
      setTenants(mapped);
      setSelectedTenant(prev => prev ? mapped.find(t => t.id === prev.id) || null : null);
    } catch (err) {
      console.error('Failed to fetch file cabinet data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleAdminRead = async (itemId: string, current: boolean) => {
    const { error } = await supabase.from('tenant_checklists').update({ admin_read: !current }).eq('id', itemId);
    if (error) alert('Failed to update admin read status: ' + error.message);
    fetchData();
  };

  const toggleSentToAttorney = async (itemId: string, current: boolean) => {
    const { error } = await supabase.from('tenant_checklists').update({ sent_to_attorney: !current }).eq('id', itemId);
    if (error) alert('Failed to update attorney status: ' + error.message);
    fetchData();
  };

  const toggleTenantCompletion = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
    const { error } = await supabase.from('tenant_checklists').update({ status: newStatus, completed_at: completedAt }).eq('id', itemId);
    if (error) alert('Failed to update completion status: ' + error.message);
    fetchData();
  };

  const deleteChecklistItem = async (itemId: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}" from this tenant's checklist?`)) return;
    const { error } = await supabase.from('tenant_checklists').delete().eq('id', itemId);
    if (error) {
      alert('Failed to delete checklist item: ' + error.message);
    } else {
      fetchData();
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.title) return;
    const { error } = await supabase.from('checklist_templates').insert({
      title: newTemplate.title,
      description: newTemplate.description,
      form_url: newTemplate.form_url || null,
      urgency_level: newTemplate.urgency_level,
      is_global: true,
    });
    if (error) { console.error(error); return; }

    // Auto-assign to all tenants
    const { data: allTenants } = await supabase.from('tenants').select('id');
    const { data: newTemplates } = await supabase.from('checklist_templates').select('id').eq('title', newTemplate.title).order('created_at', { ascending: false }).limit(1);

    if (allTenants && newTemplates && newTemplates[0]) {
      const inserts = allTenants.map((t: any) => ({
        tenant_id: t.id,
        template_id: newTemplates[0].id,
        deadline: newTemplate.deadline || null,
      }));
      await supabase.from('tenant_checklists').insert(inserts);
    }

    setNewTemplate({ title: '', description: '', form_url: '', deadline: '', urgency_level: 'Normal' });
    setShowNewTemplate(false);
    fetchData();
  };

  const generateSignupCode = async () => {
    if (!newCodeUnit) return;
    const code = crypto.randomUUID().slice(0, 8);
    await supabase.from('signup_codes').insert({ code, unit_number: newCodeUnit });
    setNewCodeUnit('');
    fetchData();
  };

  const createTenantWithQr = async () => {
    if (!newQrName || !newQrEmail || !newQrUnit) {
      setQrError('Please fill out all required fields.');
      return;
    }

    setIsGeneratingQr(true);
    setQrError(null);

    try {
      const nameParts = newQrName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      const password = newQrPassword || 'pass_' + Math.random().toString(36).substring(2, 10) + '!';

      const { data: token, error } = await supabase.rpc('admin_create_tenant_with_qr', {
        p_email: newQrEmail.trim(),
        p_first_name: firstName,
        p_last_name: lastName,
        p_unit_number: parseInt(newQrUnit, 10),
        p_password: password
      });

      if (error) throw error;

      const link = `${window.location.origin}/qr-login?token=${token}`;
      setGeneratedQrDetails({
        name: newQrName.trim(),
        email: newQrEmail.trim(),
        link,
        password_plain: password
      });

      setNewQrName('');
      setNewQrEmail('');
      setNewQrUnit('');
      setNewQrPassword('');
      fetchData();
    } catch (err: any) {
      console.error('Error creating tenant with QR:', err);
      setQrError(err.message || 'Failed to create tenant.');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const deleteQrLogin = async (token: string) => {
    if (!confirm('Are you sure you want to revoke this QR login token? The resident will no longer be able to log in using this QR code.')) return;
    try {
      const { error } = await supabase.from('tenant_qr_logins').delete().eq('token', token);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      console.error('Error deleting QR login:', err);
      alert('Failed to revoke QR token: ' + err.message);
    }
  };



  const saveTutorial = async () => {
    if (!tutorialForm.page_path || !tutorialForm.video_url) return;
    const { error } = await supabase.from('page_tutorials').upsert({
      page_path: tutorialForm.page_path,
      video_url: tutorialForm.video_url
    }, { onConflict: 'page_path' });
    if (error) alert('Error saving tutorial: ' + error.message);
    else { alert('Tutorial saved!'); setShowTutorialManager(false); setTutorialForm({page_path:'', video_url:''}); }
  };

  const distributeNotice = async () => {
    if (!noticeForm.title) return;
    setIsUploadingNotice(true);
    try {
      let file_url = '';
      let audio_url = '';

      if (noticeFile) {
        const fileExt = noticeFile.name.split('.').pop();
        const fileName = `doc_${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('letters').upload(fileName, noticeFile);
        if (error) throw error;
        file_url = supabase.storage.from('letters').getPublicUrl(fileName).data.publicUrl;
      }

      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `audio_${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('letters').upload(fileName, audioFile);
        if (error) throw error;
        audio_url = supabase.storage.from('letters').getPublicUrl(fileName).data.publicUrl;
      }

      const { error: dbError } = await supabase.from('official_letters').insert({
        title: noticeForm.title,
        description: noticeForm.description,
        target_type: noticeForm.target_type,
        tenant_id: noticeForm.target_type === 'tenant' ? noticeForm.tenant_id : null,
        file_url: file_url || null,
        audio_url: audio_url || null
      });

      if (dbError) throw dbError;
      alert('Notice distributed successfully!');
      setShowNoticeDistributor(false);
      setNoticeForm({ title: '', description: '', target_type: 'all', tenant_id: '' });
      setNoticeFile(null);
      setAudioFile(null);
    } catch (err: any) {
      alert('Failed to distribute notice: ' + err.message);
    } finally {
      setIsUploadingNotice(false);
    }
  };

  const getStatusIcon = (item: ChecklistEntry) => {
    const now = new Date();
    const deadline = item.deadline ? new Date(item.deadline + 'T23:59:59') : null;
    const hours48 = deadline ? (deadline.getTime() - now.getTime()) / (1000 * 3600) : null;

    if (item.status === 'completed') return <i className="fa-solid fa-check text-emerald-500"></i>;
    if (deadline && now >= deadline) return <i className="fa-solid fa-xmark text-red-500"></i>;
    if (hours48 !== null && hours48 <= 48 && hours48 > 0) return <i className="fa-solid fa-exclamation text-amber-500"></i>;
    return <div className="w-3 h-3 rounded border-2 border-slate-300"></div>;
  };

  const handleForward = async () => {
    if (!forwardEmail || !showForwardModal) return;
    setForwardSending(true);
    // In production, this would call a Supabase Edge Function to send the email
    console.log(`Forwarding "${showForwardModal.title}" for ${forwardTenantName} to ${forwardEmail}`);
    await toggleSentToAttorney(showForwardModal.id, false);
    setForwardSending(false);
    setShowForwardModal(null);
    setForwardEmail('');
    alert(`Form response forwarded to ${forwardEmail}. (Email integration will be connected in Phase 5)`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
            <i className="fa-solid fa-cabinet-filing"></i>
          </div>
          <span>File Cabinet</span>
        </h1>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowTutorialManager(true)} className="px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 transition-all">
            <i className="fa-solid fa-play mr-1"></i> Tutorials
          </button>
          <button onClick={() => setShowNoticeDistributor(true)} className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all">
            <i className="fa-solid fa-bullhorn mr-1"></i> Letters/Notices
          </button>
          <button onClick={() => setShowCodeGen(true)} className="px-3 py-2 bg-purple-500 text-white text-xs font-bold rounded-lg hover:bg-purple-600 transition-all">
            <i className="fa-solid fa-user-plus mr-1"></i> Invite / Create Account
          </button>
          <button onClick={() => setShowNewTemplate(true)} className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">
            <i className="fa-solid fa-plus mr-1"></i> Form/Task
          </button>
          <div className="bg-slate-100 rounded-lg flex overflow-hidden border border-slate-200">
            <button onClick={() => setView('cabinets')} className={`px-3 py-2 text-xs font-bold transition-all ${view === 'cabinets' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
              <i className="fa-solid fa-folder mr-1"></i> Cabinets
            </button>
            <button onClick={() => setView('grid')} className={`px-3 py-2 text-xs font-bold transition-all ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
              <i className="fa-solid fa-table-cells mr-1"></i> Grid
            </button>
          </div>
        </div>
      </div>

      {/* CABINET VIEW */}
      {view === 'cabinets' && !selectedTenant && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map(t => {
            const completed = t.items.filter(i => i.status === 'completed').length;
            const total = t.items.length;
            const pastDue = t.items.filter(i => i.status !== 'completed' && i.deadline && new Date() >= new Date(i.deadline + 'T23:59:59')).length;
            return (
              <button key={t.id} onClick={() => setSelectedTenant(t)}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-left hover:shadow-md hover:border-blue-300 transition-all group">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-sm shadow">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{t.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unit {t.unit}</p>
                  </div>
                </div>
                {total > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>{completed}/{total} completed</span>
                      {pastDue > 0 && <span className="text-red-500 font-bold">{pastDue} past due</span>}
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(completed / total) * 100}%` }}></div>
                    </div>
                  </div>
                )}
                {total === 0 && <p className="text-xs text-slate-400">No tasks assigned</p>}
              </button>
            );
          })}
        </div>
      )}

      {/* SELECTED TENANT DETAIL */}
      {view === 'cabinets' && selectedTenant && (
        <div>
          <button onClick={() => setSelectedTenant(null)} className="text-sm text-blue-600 font-bold hover:underline mb-4 flex items-center space-x-1">
            <i className="fa-solid fa-arrow-left"></i><span>Back to all cabinets</span>
          </button>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {selectedTenant.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedTenant.name}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Unit {selectedTenant.unit} • {selectedTenant.email}</p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            {selectedTenant.items.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-slate-400 text-sm">No tasks assigned to this tenant.</p>
              </div>
            )}
            {selectedTenant.items.map((item, idx) => {
              const pastDue = item.status !== 'completed' && item.deadline && new Date() >= new Date(item.deadline + 'T23:59:59');
              return (
                <div key={item.id} className={`bg-white rounded-2xl shadow-sm border p-5 ${pastDue ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-400 w-6">{idx + 1}.</span>

                    {/* Col 1: Tenant completion (Admin Override) */}
                    <button onClick={() => toggleTenantCompletion(item.id, item.status)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.status === 'completed' ? 'bg-emerald-500/20 hover:bg-emerald-500/30' : 'bg-slate-100 hover:bg-slate-200 cursor-pointer'}`}
                      title={item.status === 'completed' ? 'Mark as incomplete' : 'Mark as completed on behalf of tenant'}>
                      {getStatusIcon(item)}
                    </button>

                    {/* Col 2: Admin read */}
                    <button onClick={() => toggleAdminRead(item.id, item.admin_read)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.admin_read ? 'bg-blue-500/20' : 'bg-slate-100 hover:bg-slate-200'}`}
                      title={item.admin_read ? 'Marked as read' : 'Mark as read'}>
                      {item.admin_read ? <i className="fa-solid fa-check text-blue-500 text-sm"></i> : <div className="w-3 h-3 rounded border-2 border-slate-300"></div>}
                    </button>

                    {/* Col 3: Sent to attorney */}
                    <button onClick={() => {
                      if (!item.sent_to_attorney) {
                        setShowForwardModal(item);
                        setForwardTenantName(selectedTenant.name);
                      } else {
                        toggleSentToAttorney(item.id, true);
                      }
                    }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.sent_to_attorney ? 'bg-purple-500/20' : 'bg-slate-100 hover:bg-slate-200'}`}
                      title={item.sent_to_attorney ? 'Sent to attorney' : 'Forward to attorney'}>
                      {item.sent_to_attorney ? <i className="fa-solid fa-check text-purple-500 text-sm"></i> : <i className="fa-solid fa-paper-plane text-slate-400 text-xs"></i>}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm ${pastDue ? 'text-red-700' : 'text-slate-800'}`}>
                        {item.form_url ? (
                          <a href={item.form_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                            {item.title} <i className="fa-solid fa-arrow-up-right-from-square ml-2 text-[10px] text-slate-400"></i>
                          </a>
                        ) : (
                          item.title
                        )}
                      </h3>
                      {item.deadline && (
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${pastDue ? 'text-red-500' : 'text-slate-400'}`}>
                          Due: {new Date(item.deadline + 'T00:00:00').toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Delete item button */}
                    <button onClick={() => deleteChecklistItem(item.id, item.title)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all cursor-pointer text-red-500 shrink-0 border-0"
                      title="Delete checklist item">
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend for this view */}
          <div className="mt-4 bg-slate-50 rounded-xl p-3 flex flex-wrap gap-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            <span>Col 1: Tenant Status</span>
            <span>Col 2: Admin Read</span>
            <span>Col 3: Sent to Attorney</span>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {view === 'grid' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left p-3 font-bold text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Task</th>
                {tenants.filter(t => t.items.length > 0).map(t => (
                  <th key={t.id} className="text-center p-3 font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    Unit {t.unit}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map(tmpl => (
                <tr key={tmpl.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-700 sticky left-0 bg-white z-10 whitespace-nowrap">{tmpl.title}</td>
                  {tenants.filter(t => t.items.length > 0).map(t => {
                    const match = t.items.find(i => i.title === tmpl.title);
                    return (
                      <td key={t.id} className="text-center p-3">
                        {match ? getStatusIcon(match) : <span className="text-slate-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Grid legend */}
          <div className="p-3 border-t border-slate-100 flex flex-wrap gap-4 text-[10px] text-slate-400">
            <span className="flex items-center space-x-1"><i className="fa-solid fa-check text-emerald-500"></i><span>Completed</span></span>
            <span className="flex items-center space-x-1"><i className="fa-solid fa-xmark text-red-500"></i><span>Past Due</span></span>
            <span className="flex items-center space-x-1"><i className="fa-solid fa-exclamation text-amber-500"></i><span>&lt;48hrs left</span></span>
            <span className="flex items-center space-x-1"><div className="w-2 h-2 rounded border border-slate-300"></div><span>Pending</span></span>
          </div>
        </div>
      )}

      {/* NEW TEMPLATE MODAL */}
      {showNewTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Form / Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Title *</label>
                <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Intake Form" value={newTemplate.title} onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
                <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief description" value={newTemplate.description} onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Google Form URL</label>
                <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://docs.google.com/forms/..." value={newTemplate.form_url} onChange={e => setNewTemplate({ ...newTemplate, form_url: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Urgency Level</label>
                <select className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={newTemplate.urgency_level} onChange={e => setNewTemplate({ ...newTemplate, urgency_level: e.target.value })}>
                  <option value="Critical">1 - Critical</option>
                  <option value="Urgent">2 - Urgent</option>
                  <option value="High">3 - High</option>
                  <option value="Normal">4 - Normal</option>
                  <option value="Low">5 - Low</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deadline</label>
                <input type="date" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={newTemplate.deadline} onChange={e => setNewTemplate({ ...newTemplate, deadline: e.target.value })} />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowNewTemplate(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={createTemplate} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">Create & Assign to All</button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE CODE GENERATOR */}
      {showCodeGen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Resident Access & Onboarding</h3>
            
            {/* Tabs */}
            <div className="flex border-b border-slate-100 mb-4">
              <button
                onClick={() => setActiveTab('invite')}
                className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all ${activeTab === 'invite' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Self-Signup Invite
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-all ${activeTab === 'qr' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Create Account (QR/Credentials)
              </button>
            </div>

            {activeTab === 'invite' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Number *</label>
                  <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 302" value={newCodeUnit} onChange={e => setNewCodeUnit(e.target.value)} />
                </div>
                <button onClick={generateSignupCode} className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700">
                  <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Generate Invite Code
                </button>

                {signupCodes.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Existing Invite Codes</p>
                    {signupCodes.map(c => (
                      <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${c.is_used ? 'bg-slate-50 border-slate-200 opacity-50' : 'bg-purple-50 border-purple-200'}`}>
                        <div>
                          <span className="font-mono font-bold text-purple-700">{c.code}</span>
                          <span className="text-slate-400 ml-2">Unit {c.unit_number}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {c.is_used ? <span className="text-slate-400">Used</span> : (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/signup?code=${c.code}`);
                                setCopiedId(c.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${copiedId === c.id ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'text-purple-600 hover:underline font-bold'}`}
                            >
                              {copiedId === c.id ? 'Copied!' : 'Copy Link'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name *</label>
                    <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Jane Doe" value={newQrName} onChange={e => setNewQrName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address *</label>
                    <input type="email" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. jane.doe@example.com" value={newQrEmail} onChange={e => setNewQrEmail(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Number *</label>
                      <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 302" value={newQrUnit} onChange={e => setNewQrUnit(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Password (Optional)</label>
                      <input type="password" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Auto-generated if blank" value={newQrPassword} onChange={e => setNewQrPassword(e.target.value)} />
                    </div>
                  </div>

                  {qrError && (
                    <div className="text-xs text-rose-500 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      {qrError}
                    </div>
                  )}

                  <button onClick={createTenantWithQr} disabled={isGeneratingQr} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isGeneratingQr ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-qrcode mr-1"></i>Create Account & Generate QR
                      </>
                    )}
                  </button>
                </div>

                {qrLogins.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-y-auto space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Existing QR Logins</p>
                    {qrLogins.map(q => {
                      const tenantName = q.tenants ? `${q.tenants.first_name || ''} ${q.tenants.last_name || ''}`.trim() : q.email;
                      const unit = q.tenants?.unit_number || 'N/A';
                      const link = `${window.location.origin}/qr-login?token=${q.token}`;
                      return (
                        <div key={q.token} className="flex items-center justify-between p-3 rounded-xl border border-slate-150 bg-slate-50/55 text-xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-slate-700 truncate">{tenantName}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Unit {unit} • {q.email}</p>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button
                              onClick={() => {
                                setGeneratedQrDetails({
                                  name: tenantName,
                                  email: q.email,
                                  link,
                                  password_plain: q.password_plain || 'N/A (already created)'
                                });
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-lg text-[11px] font-bold hover:bg-indigo-100 hover:border-indigo-300 transition-all"
                            >
                              Show QR
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(link);
                                setCopiedId(q.token);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${copiedId === q.token ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300'}`}
                            >
                              {copiedId === q.token ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button
                              onClick={() => deleteQrLogin(q.token)}
                              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-350 transition-all"
                              title="Revoke QR Token"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            <button onClick={() => { setShowCodeGen(false); setQrError(null); }} className="w-full mt-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">Close</button>
          </div>
        </div>
      )}

      {/* FORWARD TO ATTORNEY MODAL */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Forward to Attorney</h3>
            <p className="text-sm text-slate-500 mb-4">
              Send "<strong>{showForwardModal.title}</strong>" from <strong>{forwardTenantName}</strong> to your attorney.
            </p>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attorney Email</label>
              <input type="email" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="attorney@lawfirm.com" value={forwardEmail} onChange={e => setForwardEmail(e.target.value)} />
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => { setShowForwardModal(null); setForwardEmail(''); }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleForward} disabled={forwardSending || !forwardEmail} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50">
                {forwardSending ? 'Sending...' : 'Forward'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TUTORIAL MANAGER MODAL */}
      {showTutorialManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Manage Video Tutorials</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Page Path *</label>
                <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. /my-checklist" value={tutorialForm.page_path} onChange={e => setTutorialForm({ ...tutorialForm, page_path: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-1">Include the forward slash (e.g., /admin-dashboard, /issues)</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">YouTube URL *</label>
                <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://youtube.com/watch?v=..." value={tutorialForm.video_url} onChange={e => setTutorialForm({ ...tutorialForm, video_url: e.target.value })} />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowTutorialManager(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={saveTutorial} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Save Tutorial</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTICE DISTRIBUTOR MODAL */}
      {showNoticeDistributor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Distribute Official Notice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notice Title *</label>
                <input className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Upcoming Maintenance" value={noticeForm.title} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
                <textarea className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" rows={3} placeholder="Brief details about the notice" value={noticeForm.description} onChange={e => setNoticeForm({ ...noticeForm, description: e.target.value })}></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Audience</label>
                <select className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={noticeForm.target_type} onChange={e => setNoticeForm({ ...noticeForm, target_type: e.target.value })}>
                  <option value="all">Everyone (Global Notice)</option>
                  <option value="tenant">Specific Tenant</option>
                </select>
              </div>
              {noticeForm.target_type === 'tenant' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Select Tenant</label>
                  <select className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" value={noticeForm.tenant_id} onChange={e => setNoticeForm({ ...noticeForm, tenant_id: e.target.value })}>
                    <option value="">-- Choose Tenant --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Unit {t.unit})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Document File (PDF, Image)</label>
                <input type="file" accept=".pdf,image/*" onChange={e => setNoticeFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Audio Read-Aloud (.mp3, .wav)</label>
                <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowNoticeDistributor(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50" disabled={isUploadingNotice}>Cancel</button>
              <button onClick={distributeNotice} disabled={isUploadingNotice || !noticeForm.title} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center">
                {isUploadingNotice ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Distribute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Presentation Modal */}
      {generatedQrDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-center relative">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <i className="fa-solid fa-qrcode text-white text-3xl"></i>
              </div>
              <h3 className="text-xl font-black">QR Login Generated</h3>
              <p className="text-indigo-100 text-xs mt-1">Intake account ready for resident hand-off</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* QR code image */}
              <div className="flex flex-col items-center justify-center p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
                <img
                  src={qrDataUrl}
                  alt="Resident QR Code"
                  className="w-44 h-44 bg-white p-2 border border-slate-100 rounded-xl shadow-sm"
                />
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider mt-3 mb-2">Scan to Log In Instantly</span>
                <div className="flex gap-2 w-full max-w-xs mt-1">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(qrDataUrl);
                        const blob = await response.blob();
                        await navigator.clipboard.write([
                          new ClipboardItem({
                            [blob.type]: blob
                          })
                        ]);
                        alert('QR Code image copied to clipboard!');
                      } catch (err) {
                        console.error('Failed to copy image:', err);
                        alert('Failed to copy image to clipboard. Please right-click the QR image to copy it.');
                      }
                    }}
                    className="flex-1 py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-305 transition-all flex items-center justify-center gap-1"
                  >
                    Copy Image
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrDataUrl;
                      link.download = `QR_Login_${generatedQrDetails.name.replace(/\s+/g, '_')}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex-1 py-1.5 px-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all flex items-center justify-center gap-1"
                  >
                    Download PNG
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Resident</label>
                  <p className="text-sm font-bold text-slate-800">{generatedQrDetails.name} ({generatedQrDetails.email})</p>
                </div>

                {/* Link Input with Copy */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Magic Login Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedQrDetails.link}
                      className="flex-1 text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-600 outline-none select-all font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedQrDetails.link);
                        setCopiedDetailsType('link');
                        setTimeout(() => setCopiedDetailsType(null), 1500);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${copiedDetailsType === 'link' ? 'bg-emerald-100 border-emerald-200 text-emerald-700 font-bold text-xs px-3' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300'}`}
                    >
                      {copiedDetailsType === 'link' ? 'Copied' : <i className="fa-solid fa-copy"></i>}
                    </button>
                  </div>
                </div>

                {/* Password Input with Copy */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Temporary Password</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedQrDetails.password_plain}
                      className="flex-1 text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-600 outline-none select-all font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedQrDetails.password_plain);
                        setCopiedDetailsType('pass');
                        setTimeout(() => setCopiedDetailsType(null), 1500);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${copiedDetailsType === 'pass' ? 'bg-emerald-100 border-emerald-200 text-emerald-700 font-bold text-xs px-3' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300'}`}
                    >
                      {copiedDetailsType === 'pass' ? 'Copied' : <i className="fa-solid fa-copy"></i>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  const qrCodeUrl = qrDataUrl;
                  printWindow.document.write(`
                    <html>
                    <head>
                      <title>Resident Portal Credentials - ${generatedQrDetails.name}</title>
                      <style>
                        body {
                          font-family: system-ui, -apple-system, sans-serif;
                          padding: 40px;
                          color: #1e293b;
                          max-width: 600px;
                          margin: 0 auto;
                          line-height: 1.5;
                        }
                        .header {
                          text-align: center;
                          border-bottom: 2px solid #e2e8f0;
                          padding-bottom: 20px;
                          margin-bottom: 30px;
                        }
                        .logo {
                          font-size: 24px;
                          font-weight: 800;
                          color: #4f46e5;
                          margin-bottom: 5px;
                        }
                        .subtitle {
                          font-size: 14px;
                          color: #64748b;
                        }
                        .qr-container {
                          text-align: center;
                          margin: 30px 0;
                          padding: 20px;
                          border: 1px solid #e2e8f0;
                          border-radius: 12px;
                          background: #f8fafc;
                        }
                        .qr-image {
                          width: 200px;
                          height: 200px;
                          margin-bottom: 15px;
                        }
                        .instructions {
                          font-size: 14px;
                          margin-top: 20px;
                        }
                        .credentials {
                          margin-top: 30px;
                          padding: 15px;
                          background: #f1f5f9;
                          border-radius: 8px;
                          font-size: 14px;
                        }
                        .credential-row {
                          display: flex;
                          justify-content: space-between;
                          margin-bottom: 8px;
                        }
                        .credential-row:last-child {
                          margin-bottom: 0;
                        }
                        .label {
                          font-weight: bold;
                          color: #475569;
                        }
                        .value {
                          font-family: monospace;
                          font-weight: bold;
                        }
                        @media print {
                          body { padding: 20px; }
                          .no-print { display: none; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="logo">SF Housing Hub</div>
                        <div class="subtitle">Resident Action Portal Credentials</div>
                      </div>
                      
                      <p>Hello <strong>${generatedQrDetails.name}</strong>,</p>
                      <p>Your Resident intake account has been successfully set up. You can log in using either the QR Code below or the credentials list.</p>
                      
                      <div class="qr-container">
                        <img class="qr-image" src="${qrCodeUrl}" alt="QR Code Login" />
                        <div style="font-weight: bold; font-size: 16px; color: #4f46e5;">Scan to Log In Instantly</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Open your phone camera to scan and authenticate instantly.</div>
                      </div>
                      
                      <div class="instructions">
                        <strong>How to log in:</strong>
                        <ol>
                          <li>Scan the QR code with your smartphone camera, or</li>
                          <li>Go to the link printed below, or</li>
                          <li>Use your email and temporary password to log in manually.</li>
                        </ol>
                      </div>
                      
                      <div class="credentials">
                        <div class="credential-row">
                          <span class="label">Magic Link:</span>
                          <span class="value" style="word-break: break-all; font-size: 11px;">${generatedQrDetails.link}</span>
                        </div>
                        <div class="credential-row" style="margin-top: 10px;">
                          <span class="label">Email:</span>
                          <span class="value">${generatedQrDetails.email}</span>
                        </div>
                        <div class="credential-row">
                          <span class="label">Temporary Password:</span>
                          <span class="value">${generatedQrDetails.password_plain}</span>
                        </div>
                      </div>
                      
                      <div style="margin-top: 40px; text-align: center;" class="no-print">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print This Sheet</button>
                      </div>
                      
                      <script>
                        window.onload = function() {
                          setTimeout(function() {
                            window.print();
                          }, 500);
                        }
                      </script>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-all"
              >
                <i className="fa-solid fa-print"></i> Print Sheet
              </button>
              <button
                onClick={() => setGeneratedQrDetails(null)}
                className="flex-1 py-3 px-4 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFileCabinet;
