
import React, { useState } from 'react';
import { Issue, InteractionLogEntry } from '../types';
import { dbiService } from '../services/dbiService';
import { Copy, Check, FileText, X } from 'lucide-react';

interface DBIPacketViewProps {
    issue: Issue;
    interactions: InteractionLogEntry[];
    onClose: () => void;
}

const DBIPacketView: React.FC<DBIPacketViewProps> = ({ issue, interactions, onClose }) => {
    const [copied, setCopied] = useState(false);
    const packet = dbiService.generateDBIPacket(issue, interactions);

    const handleCopy = () => {
        navigator.clipboard.writeText(packet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">DBI Complaint Packet</h2>
                            <p className="text-sm text-slate-500">Ready for SF 311 or DBI Online Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 font-mono text-sm">
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-inner whitespace-pre-wrap leading-relaxed text-slate-700">
                        {packet}
                    </div>
                </div>

                <div className="p-6 border-t bg-white flex justify-between items-center">
                    <p className="text-sm text-slate-500 italic max-w-xs">
                        Tip: Paste this directly into the "Description of Issue" field on the DBI complaint form.
                    </p>
                    <button
                        onClick={handleCopy}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all ${copied
                                ? 'bg-green-600 text-white shadow-green-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                            } shadow-lg active:scale-95`}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        <span>{copied ? 'Copied to Clipboard' : 'Copy Full Packet'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DBIPacketView;
