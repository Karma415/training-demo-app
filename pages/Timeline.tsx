import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO, differenceInHours } from 'date-fns';
import { useNavigate } from 'react-router-dom';

function parseRangeFilter(input: string): number[] {
    const activeNumbers = new Set<number>();
    const parts = input.split(',');
    
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        
        if (part.includes(':')) {
            const [startStr, endStr] = part.split(':');
            const start = parseInt(startStr?.trim() || '');
            const end = parseInt(endStr?.trim() || '');
            
            if (!isNaN(start) && !isNaN(end)) {
                const min = Math.min(start, end);
                const max = Math.max(start, end);
                for (let i = min; i <= max; i++) {
                    activeNumbers.add(i);
                }
            }
        } else {
            const num = parseInt(part);
            if (!isNaN(num)) activeNumbers.add(num);
        }
    }
    return Array.from(activeNumbers);
}

const Timeline: React.FC = () => {
  const { user, issues, tenants, adminViewMode, interactionLogs } = useApp();
  const navigate = useNavigate();

  const isAdmin = (user.role === 'admin' || user.role === 'superadmin' || user.role === 'legal_counsel') && adminViewMode === 'global';

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterUnits, setFilterUnits] = useState('');
  const [filterFloors, setFilterFloors] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Process issues and interactions into timeline events
  const timelineEvents = useMemo(() => {
    const issueEvents = issues.map(issue => {
      const categoryStr = Array.isArray(issue.category) ? issue.category.join(', ') : (issue.category || '');
      const isHistorical = categoryStr.startsWith('Historical -') || issue.status === 'Resolved';
      const tenant = tenants.find(t => t.id === issue.tenantId);
      
      const realCategory = categoryStr.replace('Historical - ', '');

      return {
        id: issue.id,
        type: 'issue' as const,
        isHistorical,
        realCategory,
        unit: (tenant?.unit && tenant.unit !== 'N/A') ? tenant.unit : 'Unassigned',
        tenantName: (tenant?.name && tenant.name.trim() !== '') ? tenant.name : (tenant as any)?.email || 'Unknown Tenant',
        timestamp: new Date(issue.dateStarted).getTime(),
        dateStarted: issue.dateStarted,
        status: issue.status,
        description: issue.description
      };
    });

    const interactionEvents = interactionLogs.map(log => {
      const tenant = tenants.find(t => t.id === log.tenantId);
      const safeTimestamp = log.timestamp || new Date().toISOString();
      
      const realCategory = log.interactionType === 'system_event' || log.event_type === 'system_event' 
        ? (log.summary || 'System Event')
        : `${log.interactionType || log.event_type || 'Unknown'} Interaction`;

      let descriptionStr = log.detailedNotes || '';
      if (log.staffName || log.staff_name) {
          const staff = log.staffName || log.staff_name;
          const role = log.staffRole || log.staffTitle || '';
          const roleStr = role ? ` (${role})` : '';
          descriptionStr = `${staff}${roleStr}:\n${descriptionStr}`;
      }

      return {
        id: log.id,
        relatedIssueId: log.relatedIssueId || (log as any).issue_id, // include issue_id if available
        type: 'interaction' as const,
        isHistorical: false,
        realCategory,
        unit: (tenant?.unit && tenant.unit !== 'N/A') ? tenant.unit : 'Unassigned',
        tenantName: (tenant?.name && tenant.name.trim() !== '') ? tenant.name : (tenant as any)?.email || 'Unknown Tenant',
        timestamp: new Date(safeTimestamp).getTime(),
        dateStarted: safeTimestamp,
        status: log.promiseMadeStatus === 'Yes' ? 'Promised' : 'Logged',
        description: descriptionStr || log.summary || 'No details provided'
      };
    });

    return [...issueEvents, ...interactionEvents].sort((a, b) => b.timestamp - a.timestamp);
  }, [issues, interactionLogs, tenants]);

  // Apply filters
  const filteredEvents = useMemo(() => {
     let filtered = timelineEvents;
     
     if (filterStartDate) {
         const start = new Date(filterStartDate).getTime();
         filtered = filtered.filter(e => e.timestamp >= start);
     }
     if (filterEndDate) {
         const end = new Date(filterEndDate).setHours(23, 59, 59, 999);
         filtered = filtered.filter(e => e.timestamp <= end);
     }

     if (filterCategory !== 'All') {
         if (filterCategory === 'Interactions') {
             filtered = filtered.filter(e => e.type === 'interaction');
         } else if (filterCategory === 'Issues') {
             filtered = filtered.filter(e => e.type === 'issue');
         } else {
             filtered = filtered.filter(e => e.realCategory === filterCategory);
         }
     }
     
     if (filterStatus !== 'All') {
         if (filterStatus === 'Resolved') {
             filtered = filtered.filter(e => e.status === 'Resolved' || e.isHistorical);
         } else if (filterStatus === 'Unresolved') {
             filtered = filtered.filter(e => e.status !== 'Resolved' && !e.isHistorical && e.type === 'issue');
         } else if (filterStatus === 'Open') {
             filtered = filtered.filter(e => (e.status === 'Reported' || e.status === 'pending' || e.status === 'in_progress') && !e.isHistorical);
         }
     }

     if (filterUnits.trim()) {
         const allowedUnits = parseRangeFilter(filterUnits);
         if (allowedUnits.length > 0) {
              filtered = filtered.filter(e => {
                  if (e.unit === 'Unknown' || e.unit === 'Unassigned') return false;
                  return allowedUnits.includes(parseInt(e.unit));
              });
         }
     }

     if (filterFloors.trim()) {
         const allowedFloors = parseRangeFilter(filterFloors);
         if (allowedFloors.length > 0) {
              filtered = filtered.filter(e => {
                  if (e.unit === 'Unknown' || e.unit === 'Unassigned') return false;
                  const unitNum = parseInt(e.unit);
                  const floorNum = Math.floor(unitNum / 100);
                  return allowedFloors.includes(floorNum);
              });
         }
     }

     return filtered;
  }, [timelineEvents, filterStartDate, filterEndDate, filterCategory, filterStatus, filterUnits, filterFloors]);

  const issueClusters = useMemo(() => {
    if (!isAdmin) return new Set<string>();
    const clusters = new Set<string>();
    for (let i = 0; i < filteredEvents.length; i++) {
        for (let j = i + 1; j < filteredEvents.length; j++) {
            const ev1 = filteredEvents[i];
            const ev2 = filteredEvents[j];
            if (ev1.type !== 'issue' || ev2.type !== 'issue') continue;
            if (ev1.isHistorical || ev2.isHistorical) continue;
            if (ev1.realCategory === ev2.realCategory && ev1.unit !== ev2.unit) {
                const hoursDiff = Math.abs(differenceInHours(new Date(ev1.dateStarted), new Date(ev2.dateStarted)));
                if (hoursDiff <= 48) {
                    clusters.add(ev1.id);
                    clusters.add(ev2.id);
                }
            }
        }
    }
    return clusters;
  }, [filteredEvents, isAdmin]);

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Exact Timeline</h1>
            <p className="text-gray-500 mt-2">
            {isAdmin ? 'Chronological record of all building events, issues, and logs.' : 'Chronological record of your issues, interactions, and documents.'}
            </p>
        </div>
        {isAdmin && (
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
                <i className="fa-solid fa-filter"></i>
                {showFilters ? 'Hide Filters' : 'Advanced Filters'}
            </button>
        )}
      </div>

      {isAdmin && showFilters && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Date Range</label>
                  <div className="flex items-center gap-2">
                      <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full text-sm p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                      <span className="text-slate-400">to</span>
                      <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full text-sm p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                      <option value="All">All Categories & Interactions</option>
                      <option value="Issues">Only Issues</option>
                      <option value="Interactions">Only Interactions</option>
                      {/* Would dynamically populate real categories here ideally */}
                      <option value="Maintenance">Maintenance</option>
                      <option value="Harassment">Harassment</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                      <option value="All">All Statuses</option>
                      <option value="Open">Open Actions</option>
                      <option value="Unresolved">Unresolved Issues</option>
                      <option value="Resolved">Resolved / Historical</option>
                  </select>
              </div>
              <div className="md:col-span-1 lg:col-span-1">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Target Units</label>
                  <p className="text-[10px] text-slate-400 mb-2">Use commas or colons for ranges (101:105, 204)</p>
                  <input type="text" placeholder="e.g. 202:204, 303, 406" value={filterUnits} onChange={e => setFilterUnits(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div className="md:col-span-1 lg:col-span-1">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Target Floors</label>
                  <p className="text-[10px] text-slate-400 mb-2">Use commas or colons for ranges (2:5, 7)</p>
                  <input type="text" placeholder="e.g. 2:4, 6:8" value={filterFloors} onChange={e => setFilterFloors(e.target.value)} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div className="lg:col-span-1 flex items-end justify-end">
                  <button 
                      onClick={() => {
                          setFilterStartDate(''); setFilterEndDate(''); setFilterCategory('All'); setFilterStatus('All'); setFilterUnits(''); setFilterFloors('');
                      }}
                      className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors px-4 py-2"
                  >
                      Clear Filters
                  </button>
              </div>
          </div>
      )}

      <div className="relative border-l-4 border-blue-100 ml-6 space-y-10">
        {filteredEvents.map((event) => {
          const isCluster = issueClusters.has(event.id);

          return (
            <div key={event.id} className="relative pl-8">
              {/* Timeline Dot */}
              <div className={`absolute -left-[14px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                event.type === 'interaction' ? 'bg-emerald-500' : event.isHistorical ? 'bg-amber-400' : 'bg-blue-600'
              }`}>
                {isCluster && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                {isCluster && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}
              </div>

              {/* Timestamp */}
              <div className="mb-2 flex items-center space-x-3">
                <span className="text-sm font-bold text-gray-800">
                  {format(parseISO(event.dateStarted), 'MMM d, yyyy')}
                </span>
                {event.isHistorical && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Historical Record</span>
                )}
                {isCluster && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center shadow-sm">
                      <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                      Cluster Detected
                    </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    event.type === 'interaction' ? 'bg-emerald-100 text-emerald-700' :
                    event.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                    event.status === 'Reported' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-slate-200 text-slate-700'
                }`}>
                    {event.status}
                </span>
              </div>

              {/* Content Card */}
              <div 
                onClick={() => {
                    if (event.type === 'issue') {
                        if (isAdmin || user.role === 'legal_counsel') {
                            navigate(`/legal-issue/${event.id}`);
                        } else {
                            navigate(`/issues/${event.id}`);
                        }
                    } else if (event.type === 'interaction' && event.relatedIssueId) {
                        if (isAdmin || user.role === 'legal_counsel') {
                            navigate(`/legal-issue/${event.relatedIssueId}`);
                        } else {
                            navigate(`/issues/${event.relatedIssueId}`);
                        }
                    }
                }}
                className={`p-5 rounded-2xl border shadow-sm transition-all ${
                    event.type === 'issue' || (event.type === 'interaction' && event.relatedIssueId) ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
                } ${
                  event.type === 'interaction'
                    ? 'bg-[#f0fdf4] border-emerald-200 hover:border-emerald-300'
                    : event.isHistorical 
                    ? 'bg-[#fffdf7] border-amber-200/50 hover:border-amber-300 hover:shadow-md' 
                    : isCluster 
                      ? 'bg-[#fff5f5] border-red-200 border-2 shadow-red-100 hover:shadow-md' 
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
              }`}>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {event.realCategory}
                        {event.type === 'issue' && (
                            <i className="fa-solid fa-chevron-right ml-2 text-slate-400 text-sm"></i>
                        )}
                    </h3>
                    {isAdmin && (
                        <div className="text-right bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm ml-4 shrink-0">
                           <span className="block text-xs font-black text-slate-800 tracking-wider">Unit {event.unit}</span>
                           <span className="block text-[10px] text-slate-500 max-w-[120px] truncate">{event.tenantName}</span>
                        </div>
                    )}
                </div>

                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {event.description}
                </p>

                {isCluster && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        <p className="text-xs text-red-800 font-medium pl-2">
                            <i className="fa-solid fa-code-merge mr-2"></i>
                            <strong>Pattern Alert:</strong> Multiple units have reported {event.realCategory} issues within 48 hours of this event. 
                            {isAdmin && ' Preparing data for future floor plan overlay integration.'}
                        </p>
                    </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
            <div className="pl-8 text-gray-500 text-sm italic py-4">
                No events found matching current filters.
            </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
