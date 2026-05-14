import React from 'react';
import { Notification } from '../types';
import { useNotificationMessageForm } from '../hooks/useNotificationMessageForm';

interface NotificationCenterProps {
    notifications: Notification[];
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications }) => {
    const {
        showSendMessage,
        messageSubject,
        setMessageSubject,
        messageBody,
        setMessageBody,
        isSending,
        openSendMessage,
        closeSendMessage,
        handleSendMessage
    } = useNotificationMessageForm();

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Notification Center</h1>
                    <p className="text-slate-500">Stay updated with building announcements and management alerts.</p>
                </div>
                <button 
                    onClick={openSendMessage}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 hover:bg-emerald-700 transition shadow-lg shrink-0"
                >
                    <i className="fa-solid fa-paper-plane"></i>
                    <span className="hidden sm:inline">Send Message</span>
                </button>
            </div>

            {showSendMessage && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSendMessage} className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center"><i className="fa-solid fa-paper-plane mr-2"></i> Send Message</h2>
                            <button type="button" onClick={closeSendMessage} disabled={isSending} className="hover:text-emerald-200 transition"><i className="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Subject</label>
                                <input required placeholder="E.g., Question about my repair" className="w-full border rounded p-3 focus:ring-2 focus:ring-emerald-500 outline-none" value={messageSubject} onChange={e => setMessageSubject(e.target.value)} disabled={isSending} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Message Body</label>
                                <textarea required placeholder="Write your message here..." className="w-full border rounded p-3 h-40 resize-none focus:ring-2 focus:ring-emerald-500 outline-none" value={messageBody} onChange={e => setMessageBody(e.target.value)} disabled={isSending} />
                            </div>
                            <button type="submit" disabled={isSending} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold shadow hover:bg-emerald-700 transition-colors flex justify-center items-center disabled:opacity-50">
                                {isSending ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-paper-plane mr-2"></i>}
                                {isSending ? 'Sending...' : 'Send Now'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`bg-white border rounded-xl shadow-sm p-6 flex items-start space-x-4 ${notif.type === 'alert' ? 'border-l-4 border-l-[#1e3a8a]' : 'border-l-4 border-l-emerald-500'}`}
                        >
                            <div className={`p-3 rounded-full ${notif.type === 'alert' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                <i className={`fa-solid ${notif.type === 'alert' ? 'fa-bullhorn' : 'fa-envelope-open-text'}`}></i>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-slate-800">{notif.title}</h3>
                                    <span className="text-xs font-bold text-slate-400 uppercase">{new Date(notif.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed mb-3">{notif.content}</p>
                                <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                                        <i className="fa-solid fa-user text-[10px] text-slate-500"></i>
                                    </div>
                                    <span className="text-xs font-medium text-slate-500">From: {notif.sender || 'System'}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${notif.type === 'alert' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-emerald-600 border-emerald-200 bg-emerald-50'}`}>
                                        {notif.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <i className="fa-solid fa-bell-slash text-5xl text-slate-200 mb-4"></i>
                        <h3 className="text-xl font-bold text-slate-400">All caught up</h3>
                        <p className="text-slate-400">No new notifications for your unit.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
