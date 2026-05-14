
import React from 'react';
import { X, ListTodo, Calendar, AlertCircle, MapPin, Link2, Settings2 } from 'lucide-react';
import { useTaskForm } from '../hooks/useTaskForm';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (task: any) => void;
}

const TaskForm: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const {
        loading,
        error,
        formData,
        showAdvanced,
        updateFormData,
        toggleAdvanced,
        handleSubmit,
    } = useTaskForm({ onClose, onSuccess });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between mb-6 items-center">
                    <div className="flex items-center space-x-3 text-emerald-600">
                        <ListTodo size={24} />
                        <h2 className="text-xl font-bold">Add New Task</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 flex items-start text-sm border border-rose-100">
                        <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">What needs to be done?</label>
                        <textarea
                            required
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none font-medium h-24"
                            placeholder="E.g., Follow up with inspector, check lease..."
                            value={formData.description}
                            onChange={e => updateFormData('description', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            <div className="flex items-center space-x-2">
                                <Calendar size={12} />
                                <span>Optional Deadline</span>
                            </div>
                        </label>
                        <input
                            type="date"
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"
                            value={formData.dueDate}
                            onChange={e => updateFormData('dueDate', e.target.value)}
                        />
                    </div>

                    <button 
                        type="button" 
                        onClick={toggleAdvanced} 
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors w-fit"
                    >
                        <Settings2 size={12} className="mr-1.5" />
                        {showAdvanced ? 'Hide Advanced Options' : 'Show Details & Meeting Options'}
                    </button>

                    {showAdvanced && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            {/* Date & Time Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">End Date</label>
                                    <input
                                        type="date"
                                        min={formData.dueDate}
                                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                                        value={formData.endDate}
                                        onChange={e => updateFormData('endDate', e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                                            value={formData.startTime}
                                            onChange={e => updateFormData('startTime', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">End Time</label>
                                        <input
                                            type="time"
                                            className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                                            value={formData.endTime}
                                            onChange={e => updateFormData('endTime', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Meeting/Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center space-x-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">
                                        <Link2 size={10} />
                                        <span>Virtual Meeting (Zoom/Meet)</span>
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://zoom.us/j/..."
                                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                                        value={formData.meetingLink}
                                        onChange={e => updateFormData('meetingLink', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center space-x-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">
                                        <MapPin size={10} />
                                        <span>Physical Location</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Room 101, Lobby..."
                                        className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                                        value={formData.location}
                                        onChange={e => updateFormData('location', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2 h-14"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <ListTodo size={18} />
                                <span>Create Task</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TaskForm;
