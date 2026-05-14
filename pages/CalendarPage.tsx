import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import { CalendarEvent } from '../types';

const CalendarPage: React.FC = () => {
  const { user } = useApp();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    event_date: new Date().toISOString().split('T')[0],
    end_date: '',
    event_time: '',
    end_time: '',
    is_all_day: false,
    description: '',
    is_global: false,
    urgency: 'Normal'
  });
  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

      let query = supabase
        .from('calendar_events')
        .select('*')
        .gte('event_date', startOfMonth)
        .lte('event_date', endOfMonth)
        .order('event_date', { ascending: true });

      if (user?.role === 'admin' || user?.role === 'superadmin') {
        // Admins have RLS access to everything, so we explicitly filter out other tenants' *private* events
        query = query.or(`tenant_uid.eq.${user.id},is_global.eq.true`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (id: string, action: 'approve' | 'deny') => {
    try {
      if (action === 'approve') {
        const { error } = await supabase.from('calendar_events').update({ approved_by_admin: true }).eq('id', id);
        if (error) throw error;
        setEvents(events.map(e => e.id === id ? { ...e, approved_by_admin: true } : e));
      } else {
        const { error } = await supabase.from('calendar_events').delete().eq('id', id);
        if (error) throw error;
        setEvents(events.filter(e => e.id !== id));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    const today = new Date();
    // Prevent going past current month
    if (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() === today.getMonth()) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: newEvent.title,
          event_date: newEvent.event_date,
          end_date: showEndDate && newEvent.end_date ? newEvent.end_date : null,
          event_time: (!newEvent.is_all_day && newEvent.event_time) ? newEvent.event_time : null,
          end_time: (!newEvent.is_all_day && showEndTime && newEvent.end_time) ? newEvent.end_time : null,
          is_all_day: newEvent.is_all_day,
          description: newEvent.description,
          tenant_uid: user.id,
          // If tenant checks the box to submit globally, it starts unapproved
          is_global: newEvent.is_global,
          approved_by_admin: false
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setEvents(prev => [...prev, data]);
      setShowModal(false);
      setNewEvent({ title: '', event_date: new Date().toISOString().split('T')[0], end_date: '', event_time: '', end_time: '', is_all_day: false, description: '', is_global: false, urgency: 'Normal' });
      setShowEndDate(false);
      setShowEndTime(false);
    } catch (err: any) {
      alert("Failed to create event: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-slate-100 bg-slate-50/50"></div>);
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.event_date === dateString);
      const isToday = new Date().toISOString().split('T')[0] === dateString;
      
      days.push(
        <div key={day} className={`h-32 border border-slate-100 p-2 overflow-y-auto ${isToday ? 'bg-blue-50/50 ring-2 ring-blue-200 inset-0' : 'bg-white hover:bg-slate-50'} transition-colors relative`}>
          <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-700' : 'text-slate-400'}`}>{day}</div>
          <div className="space-y-1">
            {dayEvents.map(evt => (
              <div 
                key={evt.id}
                className={`text-[10px] p-1.5 rounded truncate font-medium border cursor-pointer hover:opacity-80 transition-opacity
                  ${evt.tenant_uid === user?.id && !evt.is_global
                    ? 'bg-purple-100 text-purple-800 border-purple-200' // Private Event
                    : evt.is_global && !evt.approved_by_admin
                        ? 'bg-amber-50 text-amber-700 border-amber-200' // Pending Global Event (Gold)
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200' // Approved Global Event (Green)
                  }
                `}
                onClick={() => {
                  let timeStr = evt.is_all_day ? 'All Day' : (evt.event_time ? evt.event_time.substring(0,5) : 'All Day');
                  if (evt.end_time && !evt.is_all_day) timeStr += ` - ${evt.end_time.substring(0,5)}`;
                  let dateStr = evt.event_date;
                  if (evt.end_date) dateStr += ` to ${evt.end_date}`;
                  
                  alert(`Event: ${evt.title}\nDate: ${dateStr}\nTime: ${timeStr}\n\n${evt.description || 'No description provided.'}`);
                }}
              >
                {evt.urgency === 'Critical' && <span className="mr-1 text-red-600" title="Critical Urgency">🔴</span>}
                {evt.urgency === 'High' && <span className="mr-1 text-orange-500" title="High Urgency">🟠</span>}
                {!evt.is_all_day && evt.event_time && <span className="font-bold mr-1">{evt.event_time.substring(0,5)}</span>}
                {evt.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const isCurrentMonth = currentDate.getFullYear() === new Date().getFullYear() && currentDate.getMonth() === new Date().getMonth();

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Community Calendar</h1>
          <p className="text-slate-500 font-medium">Building events and your personal schedule.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#1e3a8a] text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-900 transition-colors shadow-lg active:scale-95 flex items-center space-x-2"
        >
          <i className="fa-solid fa-plus"></i>
          <span>Add Event</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Admin Pending Approvals Queue */}
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <div className="bg-amber-50 border-b border-amber-100 p-6">
            <h3 className="font-black text-amber-800 mb-3 flex items-center"><i className="fa-solid fa-inbox mr-2"></i> Pending Event Approvals</h3>
            <div className="space-y-2">
              {events.filter(e => e.is_global && !e.approved_by_admin).length > 0 ? (
                events.filter(e => e.is_global && !e.approved_by_admin).map(evt => (
                  <div key={evt.id} className="flex justify-between items-center bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-amber-200">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{evt.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{evt.event_date} {evt.event_time ? `- ${evt.event_time}` : ''} • {evt.description || 'No description'}</p>
                    </div>
                    <div className="flex space-x-2 shrink-0">
                      <button onClick={() => handleApproveEvent(evt.id, 'approve')} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-emerald-200 transition-colors shadow-sm"><i className="fa-solid fa-check mr-1"></i> Approve</button>
                      <button onClick={() => handleApproveEvent(evt.id, 'deny')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-200 transition-colors shadow-sm"><i className="fa-solid fa-xmark mr-1"></i> Deny</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-amber-700/60 pb-1">Queue is empty. No pending tenant events.</p>
              )}
            </div>
          </div>
        )}

        {/* Calendar Header Controls */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-black text-slate-800 w-48">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrevMonth} 
                disabled={isCurrentMonth}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button 
                onClick={handleNextMonth} 
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-full bg-emerald-400"></div><span>Building</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-full bg-purple-400"></div><span>Private</span></div>
            <div className="flex items-center space-x-1.5"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span>Pending Admin</span></div>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-white">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest border-r border-slate-50 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-white relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <i className="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500"></i>
            </div>
          )}
          {renderCalendarDays()}
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-xl text-slate-800">Add Calendar Event</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Event Title</label>
                <input required type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="E.g., Tenant Meeting, Inspection..." />
              </div>
              
              <div className="space-y-4">
                {/* Date Selection */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-slate-700">Date(s)</label>
                    <label className="flex items-center cursor-pointer text-xs font-bold text-slate-500">
                      <span className="mr-2">Date Range</span>
                      <input type="checkbox" checked={showEndDate} onChange={e => setShowEndDate(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input required type="date" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    </div>
                    {showEndDate && (
                      <div>
                        <input required type="date" min={newEvent.event_date} value={newEvent.end_date} onChange={e => setNewEvent({...newEvent, end_date: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Selection */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-slate-700">Time</label>
                    <label className="flex items-center cursor-pointer text-xs font-bold text-slate-500">
                      <span className="mr-2">All Day Event</span>
                      <input type="checkbox" checked={newEvent.is_all_day} onChange={e => {
                        setNewEvent({...newEvent, is_all_day: e.target.checked});
                        if (e.target.checked) setShowEndTime(false);
                      }} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                    </label>
                  </div>
                  
                  {!newEvent.is_all_day && (
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Start Time</label>
                          <input type="time" required value={newEvent.event_time} onChange={e => setNewEvent({...newEvent, event_time: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        </div>
                        {showEndTime ? (
                          <div>
                            <div className="flex justify-between items-center">
                              <label className="block text-xs text-slate-500 mb-1">End Time</label>
                              <button type="button" onClick={() => { setShowEndTime(false); setNewEvent({...newEvent, end_time: ''}); }} className="text-xs text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i> Remove</button>
                            </div>
                            <input type="time" required value={newEvent.end_time} onChange={e => setNewEvent({...newEvent, end_time: e.target.value})} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                          </div>
                        ) : (
                          <div className="flex items-end pb-1">
                            <button type="button" onClick={() => setShowEndTime(true)} className="text-sm text-blue-600 hover:text-blue-800 font-bold"><i className="fa-solid fa-plus mr-1"></i> Add End Time</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Details / Location</label>
                <textarea rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Any extra information..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Urgency Level</label>
                <select value={newEvent.urgency} onChange={e => setNewEvent({...newEvent, urgency: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-slate-700">
                  <option value="Normal">🟢 Normal</option>
                  <option value="High">🟠 High</option>
                  <option value="Critical">🔴 Critical</option>
                </select>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start space-x-3">
                <div className="pt-0.5">
                  <input type="checkbox" id="global-share" checked={newEvent.is_global} onChange={e => setNewEvent({...newEvent, is_global: e.target.checked})} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                </div>
                <div>
                  <label htmlFor="global-share" className="text-sm font-bold text-blue-900 cursor-pointer">Submit to Admin for Building-Wide Announcement</label>
                  <p className="text-xs text-blue-700 mt-1">If checked, this event will be sent to the building admin for approval to show on everyone's calendar. Otherwise, it will only be visible to you.</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-[#1e3a8a] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900 transition-colors active:scale-95 disabled:opacity-50 flex items-center">
                  {isSubmitting ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : null}
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
