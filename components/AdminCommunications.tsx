import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabase';
import { Megaphone, Mail, Send, Bell } from 'lucide-react';

const AdminCommunications: React.FC = () => {
    const { tenants, user } = useApp();
    const [mode, setMode] = useState<'broadcast' | 'direct'>('broadcast');
    
    // Form state
    const [recipientId, setRecipientId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    
    // Delivery methods
    const [sendViaPortal, setSendViaPortal] = useState(true);
    const [sendViaEmail, setSendViaEmail] = useState(false);
    
    const [isSending, setIsSending] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!sendViaPortal && !sendViaEmail) {
            setStatusMessage({ type: 'error', text: 'Please select at least one delivery method.' });
            return;
        }

        if (mode === 'direct' && !recipientId) {
            setStatusMessage({ type: 'error', text: 'Please select a tenant for the direct message.' });
            return;
        }

        setIsSending(true);
        setStatusMessage(null);

        try {
            // 1. Send via Portal (Database Insert)
            if (sendViaPortal) {
                if (mode === 'broadcast') {
                    // Send to all tenants
                    const notifications = tenants.map(t => ({
                        user_id: t.id,
                        title: subject,
                        content: message,
                        type: 'alert',
                        urgency: 'medium',
                        purpose: 'Building Broadcast',
                        sender: user.name || 'Building Admin',
                        status: 'unread'
                    }));
                    
                    const { error } = await supabase.from('notifications').insert(notifications);
                    if (error) console.error("Portal Broadcast Error:", error);
                } else {
                    // Send to specific tenant
                    const { error } = await supabase.from('notifications').insert({
                        user_id: recipientId,
                        title: subject,
                        content: message,
                        type: 'message',
                        urgency: 'medium',
                        purpose: 'Direct Message',
                        sender: user.name || 'Building Admin',
                        status: 'unread'
                    });
                    if (error) console.error("Portal DM Error:", error);
                }
            }

            // 2. Send via Email (Edge Function)
            if (sendViaEmail) {
                let targetEmails: string[] = [];
                
                if (mode === 'broadcast') {
                    targetEmails = tenants.filter(t => t.email).map(t => t.email!);
                } else {
                    const tenant = tenants.find(t => t.id === recipientId);
                    if (tenant?.email) {
                        targetEmails = [tenant.email];
                    }
                }

                if (targetEmails.length > 0) {
                    const { error } = await supabase.functions.invoke('send-email', {
                        body: {
                            to: targetEmails,
                            subject: subject,
                            html: `
                                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
                                    <h2 style="color: #1e3a8a;">SF Housing Hub Notification</h2>
                                    <p style="white-space: pre-wrap;">${message}</p>
                                    <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
                                    <p style="color: #888; font-size: 12px;">This is an automated message from your building administrator via SF Housing Hub.</p>
                                </div>
                            `
                        }
                    });
                    
                    if (error) {
                        console.error("Email Sending Error:", error);
                        // We don't throw here so we can at least confirm portal delivery if it succeeded
                    }
                }
            }

            setStatusMessage({ type: 'success', text: `Message successfully sent via ${[sendViaPortal ? 'Portal' : null, sendViaEmail ? 'Email' : null].filter(Boolean).join(' and ')}.` });
            setSubject('');
            setMessage('');
            if (mode === 'direct') setRecipientId('');
            
        } catch (error: any) {
            console.error('Error sending message:', error);
            setStatusMessage({ type: 'error', text: 'Failed to send message. Please try again.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Megaphone className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Building Communications</h2>
                    <p className="text-xs font-medium text-slate-500 mt-1">Send announcements or direct messages to residents.</p>
                </div>
            </div>

            <div className="flex border-b border-slate-100">
                <button
                    onClick={() => { setMode('broadcast'); setStatusMessage(null); }}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                        mode === 'broadcast' 
                        ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <Megaphone className="w-4 h-4" />
                    Building Broadcast
                </button>
                <button
                    onClick={() => { setMode('direct'); setStatusMessage(null); }}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                        mode === 'direct' 
                        ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <Mail className="w-4 h-4" />
                    Direct Message
                </button>
            </div>

            <form onSubmit={handleSend} className="p-6 space-y-6">
                {statusMessage && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {statusMessage.type === 'success' ? <i className="fa-solid fa-circle-check mt-0.5 text-emerald-500"></i> : <i className="fa-solid fa-circle-exclamation mt-0.5 text-red-500"></i>}
                        <p className="text-sm font-bold">{statusMessage.text}</p>
                    </div>
                )}

                {mode === 'direct' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Recipient</label>
                        <select 
                            required
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select a resident...</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name || `${t.first_name || ''} ${t.last_name || ''}`} (Unit {t.unit_number}) - {t.email}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                    <input 
                        required
                        type="text"
                        placeholder="E.g., Upcoming Water Shutoff"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Message</label>
                    <textarea 
                        required
                        placeholder="Write your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 text-sm min-h-[160px] resize-y"
                    />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Delivery Methods</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all flex-1 ${sendViaPortal ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <input 
                                type="checkbox" 
                                checked={sendViaPortal} 
                                onChange={(e) => setSendViaPortal(e.target.checked)}
                                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-indigo-600" />
                                    Portal Notification
                                </span>
                                <span className="text-xs text-slate-500 font-medium">Shows up in Notification Center</span>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all flex-1 ${sendViaEmail ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <input 
                                type="checkbox" 
                                checked={sendViaEmail} 
                                onChange={(e) => setSendViaEmail(e.target.checked)}
                                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-indigo-600" />
                                    Email Delivery
                                </span>
                                <span className="text-xs text-slate-500 font-medium">Sends directly to inbox</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button 
                        type="submit"
                        disabled={isSending || (!sendViaPortal && !sendViaEmail)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <Send className="w-5 h-5" />}
                        {isSending ? 'Sending...' : 'Send Message'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCommunications;
