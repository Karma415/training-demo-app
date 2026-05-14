import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface ChecklistItem {
  id: string;
  template_id: string;
  title: string;
  description: string;
  form_url: string | null;
  urgency_level: string;
  status: 'pending' | 'completed';
  deadline: string | null;
  admin_read: boolean;
  sent_to_attorney: boolean;
  created_at: string;
  completed_at: string | null;
}

const TenantChecklist: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFormUrl, setActiveFormUrl] = useState<string | null>(null);
  const [activeFormTitle, setActiveFormTitle] = useState('');

  const fetchChecklist = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('tenant_checklists')
        .select(`
          id,
          template_id,
          status,
          deadline,
          admin_read,
          sent_to_attorney,
          created_at,
          completed_at,
          checklist_templates (
            title,
            description,
            form_url,
            urgency_level
          )
        `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mapped: ChecklistItem[] = (data || []).map((d: any) => ({
        id: d.id,
        template_id: d.template_id,
        title: d.checklist_templates?.title || 'Unknown Task',
        description: d.checklist_templates?.description || '',
        form_url: d.checklist_templates?.form_url || null,
        urgency_level: d.checklist_templates?.urgency_level || 'Normal',
        status: d.status,
        deadline: d.deadline,
        admin_read: d.admin_read,
        sent_to_attorney: d.sent_to_attorney,
        created_at: d.created_at,
        completed_at: d.completed_at,
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Failed to fetch checklist:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('tenant-checklist-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tenant_checklists', filter: `tenant_id=eq.${user.id}` },
        () => { fetchChecklist(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchChecklist]);

  const markCompleted = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('tenant_checklists')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('tenant_id', user?.id);

      if (error) throw error;
      fetchChecklist();
    } catch (err) {
      console.error('Failed to mark as completed:', err);
    }
  };

  const getStatusIcon = (item: ChecklistItem) => {
    const now = new Date();
    const deadline = item.deadline ? new Date(item.deadline + 'T23:59:59') : null;

    if (item.status === 'completed') {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center" title="Completed">
          <i className="fa-solid fa-check text-emerald-500 text-sm"></i>
        </div>
      );
    }

    if (deadline && now >= deadline) {
      return (
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center" title="Past due">
          <i className="fa-solid fa-xmark text-red-500 text-sm"></i>
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center" title="Pending">
        <div className="w-3 h-3 rounded border-2 border-slate-400"></div>
      </div>
    );
  };

  const getAdminReadIcon = (item: ChecklistItem) => {
    if (!item.admin_read && item.status !== 'completed') {
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center" title="Not yet reviewed by admin">
          <div className="w-3 h-3 rounded border-2 border-slate-300"></div>
        </div>
      );
    }
    if (item.admin_read) {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center" title="Received by admin">
          <i className="fa-solid fa-check text-blue-500 text-sm"></i>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center" title="Awaiting admin review">
        <div className="w-3 h-3 rounded border-2 border-slate-300"></div>
      </div>
    );
  };

  const isPastDue = (item: ChecklistItem) => {
    if (item.status === 'completed') return false;
    if (!item.deadline) return false;
    return new Date() >= new Date(item.deadline + 'T23:59:59');
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <i className="fa-solid fa-clipboard-list"></i>
          </div>
          <span>My Checklist</span>
        </h1>
        <p className="text-slate-500 text-sm mt-2">Complete all required forms and tasks below. Click on a form to fill it out.</p>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progress</span>
            <span className="text-sm font-bold text-slate-700">
              {items.filter(i => i.status === 'completed').length} / {items.length} completed
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(items.filter(i => i.status === 'completed').length / items.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center"><div className="w-2 h-2 rounded border border-slate-400"></div></div>
            <span>Incomplete</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center"><i className="fa-solid fa-check text-emerald-500 text-[10px]"></i></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center"><i className="fa-solid fa-xmark text-red-500 text-[10px]"></i></div>
            <span>Past Due</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center"><i className="fa-solid fa-check text-blue-500 text-[10px]"></i></div>
            <span>Admin Received</span>
          </div>
        </div>
      </div>

      {/* Checklist items */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <i className="fa-solid fa-clipboard text-slate-300 text-4xl mb-3"></i>
          <p className="text-slate-500 font-medium">No tasks assigned yet.</p>
          <p className="text-slate-400 text-sm">Your admin will assign forms and tasks to your checklist.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md ${
                isPastDue(item) ? 'border-red-300 bg-red-50/50' : 'border-slate-200'
              }`}
            >
              <div className="p-5 flex items-center space-x-4">
                <span className="text-xs font-bold text-slate-400 w-6 text-center">{index + 1}.</span>

                {/* Status checkbox (completion) */}
                {getStatusIcon(item)}

                {/* Admin read checkbox */}
                {getAdminReadIcon(item)}

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className={`font-bold text-sm ${isPastDue(item) ? 'text-red-700' : 'text-slate-800'}`}>
                      {item.title}
                    </h3>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md ${
                      item.urgency_level === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                      item.urgency_level === 'Urgent' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                      item.urgency_level === 'High' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      item.urgency_level === 'Low' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                      'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      {item.urgency_level}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{item.description}</p>
                  )}
                  {item.deadline && (
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                      isPastDue(item) ? 'text-red-500' : 'text-slate-400'
                    }`}>
                      <i className="fa-solid fa-calendar mr-1"></i>
                      Due: {new Date(item.deadline + 'T00:00:00').toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {item.form_url && item.status !== 'completed' && (
                    <button
                      onClick={() => { setActiveFormUrl(item.form_url); setActiveFormTitle(item.title); }}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all shadow-sm"
                    >
                      <i className="fa-solid fa-pen-to-square mr-1"></i> Fill Form
                    </button>
                  )}
                  {item.status !== 'completed' && (
                    <button
                      onClick={() => markCompleted(item.id)}
                      className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                      title="Mark as completed"
                    >
                      <i className="fa-solid fa-check mr-1"></i> Done
                    </button>
                  )}
                  {item.status === 'completed' && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                      <i className="fa-solid fa-circle-check"></i>
                      <span>Submitted</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Google Form Modal */}
      {activeFormUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <i className="fa-solid fa-file-lines text-blue-500"></i>
                <span>{activeFormTitle}</span>
              </h3>
              <button
                onClick={() => setActiveFormUrl(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-slate-500"></i>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={activeFormUrl}
                className="w-full h-full min-h-[60vh]"
                title={activeFormTitle}
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-center shrink-0">
              <p className="text-xs text-slate-500">After submitting the form above, click <strong>Done</strong> to mark this item as complete.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantChecklist;
