
import React, { useState } from 'react';
import { Issue, IssueStatus } from '../types';
import { getLegalAdviceForIssue } from '../services/legalEngine';
import { useApp } from '../context/AppContext';
import EvidenceTimeline from './EvidenceTimeline';
import DBIPacketView from './DBIPacketView';
import { History, FileText, AlertTriangle, ChevronRight } from 'lucide-react';

interface IssueCardProps {
  issue: Issue;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onDecode: (text: string) => void;
  onEscalate?: (issue: Issue) => void;
  onNavigate?: (id: string) => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onStatusChange, onDecode, onEscalate, onNavigate }) => {
  const { interactionLogs, issues } = useApp();
  const [showTimeline, setShowTimeline] = useState(false);
  const [showDBIPacket, setShowDBIPacket] = useState(false);

  const statusColors: Record<IssueStatus, string> = {
    'Reported': 'bg-blue-100 text-blue-800 border-blue-200',
    'Pending': 'bg-slate-100 text-slate-800 border-slate-200',
    'In-Progress': 'bg-amber-100 text-amber-800 border-amber-200',
    'Resolved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Stalled': 'bg-rose-100 text-rose-800 border-rose-200',
    'Escalated': 'bg-red-100 text-red-800 border-red-200',
  };

  const advice = getLegalAdviceForIssue(issue);
  const urgentAdvice = advice.find(a => a.isAlert);

  // Custom negligence Check
  const issueInteractions = interactionLogs.filter(log => log.relatedIssueId === issue.id);
  const isNeglected = (issue.status === 'Stalled' || issue.daysSinceReported > 14) && issueInteractions.length === 0;

  const getEscalationCountdown = () => {
    const start = new Date(issue.dateStarted);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const category = Array.isArray(issue.category) ? issue.category : [issue.category];
    const limit = category.includes('Other') ? 3 : 30;
    const remaining = limit - daysPassed;

    if (issue.status === 'Resolved') return null;
    return remaining;
  };

  const daysLeft = getEscalationCountdown();

  return (
    <div
      onClick={() => onNavigate && onNavigate(issue.id)}
      className={`bg-white rounded-lg border shadow-sm overflow-hidden mb-4 transition-all cursor-pointer hover:shadow-md ${urgentAdvice || isNeglected ? 'ring-2 ring-red-400 border-red-200' : 'hover:border-slate-300'
        }`}
    >
      {isNeglected && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={12} />
            <span>Active Neglect Detected: 0 Interactions in {issue.daysSinceReported} Days</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowTimeline(true); }}
            className="underline hover:text-red-100 flex items-center"
          >
            View History <ChevronRight size={12} />
          </button>
        </div>
      )}
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span
                key={issue.status}
                className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border transition-colors duration-300 animate-status-pop ${statusColors[issue.status]}`}
              >
                {issue.status}
              </span>
              {daysLeft !== null && issue.status !== 'Resolved' && (
                <div className="flex flex-col space-y-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border flex items-center space-x-1 ${daysLeft <= 0 ? 'bg-red-600 text-white border-red-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    <i className="fa-solid fa-clock"></i>
                    <span>{daysLeft <= 0 ? 'Deadline expired — escalation ready' : `${daysLeft} days until escalation`}</span>
                  </span>
                  {daysLeft <= 0 && onEscalate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEscalate(issue);
                      }}
                      className="text-[10px] font-black text-white bg-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors uppercase tracking-widest shadow-sm text-center"
                    >
                      Generate Escalation Notice
                    </button>
                  )}
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mt-2">{Array.isArray(issue.category) ? issue.category.join('/') : issue.category} Issue</h3>
            <p className="text-sm text-slate-500">Reported: {new Date(issue.dateStarted).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <select
              value={issue.status}
              onChange={(e) => onStatusChange(issue.id, e.target.value as IssueStatus)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Reported">Reported</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Stalled">Stalled</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
            <button
              onClick={() => setShowTimeline(true)}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <History size={12} />
              <span>Evidence Timeline</span>
            </button>
          </div>
        </div>

        <p className="text-slate-600 mb-4">{issue.description}</p>

        {issue.photoUrl && (
          <div className="mb-4 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-4">
            <img src={issue.photoUrl} alt="Issue Proof" className="max-h-32 rounded shadow-sm" />
          </div>
        )}

        <div className="flex items-center space-x-2 text-sm">
          <i className={`fa-solid ${issue.hasGivenNotice ? 'fa-check-circle text-green-500' : 'fa-circle-xmark text-slate-300'}`}></i>
          <span className={issue.hasGivenNotice ? 'text-slate-700' : 'text-slate-400 italic'}>
            {issue.hasGivenNotice ? 'Written notice provided' : 'Written notice required for escalation'}
          </span>
        </div>
      </div>

      {advice.length > 0 && (
        <div className="bg-slate-50 border-t p-4 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">SF Rights Advisor</p>
            {issue.daysSinceReported > 3 && (
              <button
                onClick={() => setShowDBIPacket(true)}
                className="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded flex items-center space-x-1 hover:bg-red-100 transition-colors"
                title="Generate SF DBI Complaint Packet"
              >
                <FileText size={12} />
                <span>Generate DBI Packet</span>
              </button>
            )}
          </div>
          {advice.map((item, idx) => (
            <div key={idx} className={`p-3 rounded-md text-sm border relative group ${item.isAlert ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
              <button
                onClick={() => onDecode(item.description)}
                className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-blue-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95 z-10"
                title="Decode Legal Jargon"
              >
                <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
              </button>
              <div className="flex items-start space-x-2 pr-6">
                <i className={`fa-solid ${item.isAlert ? 'fa-triangle-exclamation text-red-500' : 'fa-circle-info text-blue-500'} mt-0.5`}></i>
                <div className="flex-1">
                  <span className="font-bold block mb-1">{item.title}</span>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  {item.link && (
                    <button
                      onClick={() => {
                        if (item.type === 'dbi' && item.link?.text.includes('Packet')) {
                          setShowDBIPacket(true);
                        } else if (item.link?.url) {
                          window.open(item.link.url, '_blank');
                        }
                      }}
                      className="inline-block mt-2 text-blue-600 font-bold hover:underline text-left"
                    >
                      {item.link.text} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showTimeline && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Evidence Timeline</h2>
                  <p className="text-sm text-slate-500 font-medium">Chronological Narrative of Neglect</p>
                </div>
              </div>
              <button
                onClick={() => setShowTimeline(false)}
                className="px-4 py-2 hover:bg-slate-200 bg-slate-100 text-slate-600 rounded-lg font-bold transition-colors"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <EvidenceTimeline
                issues={issues.filter(i => i.id === issue.id)}
                interactions={interactionLogs.filter(l => l.relatedIssueId === issue.id)}
              />
            </div>
          </div>
        </div>
      )}

      {showDBIPacket && (
        <DBIPacketView
          issue={issue}
          interactions={interactionLogs}
          onClose={() => setShowDBIPacket(false)}
        />
      )}
    </div>
  );
};

export default IssueCard;
