import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Issue } from '../types';


interface IssueHistoryProps {
  issues: Issue[];
  highlightedId?: string;
}

const IssueHistory: React.FC<IssueHistoryProps> = ({
  issues,
  highlightedId
}) => {
  const navigate = useNavigate();


  useEffect(() => {
    if (highlightedId) {
      setTimeout(() => {
        const element = document.getElementById(`issue-${highlightedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedId]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">All Issues Reported</h1>
      <p className="text-slate-500 mb-8">Comprehensive legal history of all reported building conditions and evidence.</p>

      <div className="space-y-12">
        {issues.length > 0 ? (
          issues.map(issue => (
            <section
              key={issue.id}
              id={`issue-${issue.id}`}
              onClick={() => navigate(`/issues/${issue.id}`)}
              className={`bg-white border rounded-2xl shadow-sm overflow-hidden border-slate-200 transition-all duration-1000 cursor-pointer hover:shadow-md hover:border-blue-200 ${issue.id === highlightedId ? 'ring-4 ring-blue-400 ring-offset-4' : ''}`}
            >
              <div className="bg-slate-50 p-6 border-b flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {issue.status}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      ID: #{issue.id.slice(-6)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{Array.isArray(issue.category) ? issue.category.join(' / ') : issue.category} Maintenance Request</h2>
                  <p className="text-sm text-slate-500">First Reported: {isNaN(new Date(issue.dateStarted).getTime()) ? 'Unknown Date' : new Date(issue.dateStarted).toLocaleDateString()}</p>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-2 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="text-xs font-bold text-slate-400 border border-slate-200 px-4 py-2 rounded-lg flex items-center bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <i className="fa-solid fa-arrow-right mr-2"></i> View Details
                  </div>
                </div>
              </div>

              <div className="p-4 px-6">
                <p className="text-slate-600 line-clamp-2 text-sm italic">
                  "{issue.description}"
                </p>
              </div>
            </section>
          ))
        ) : (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
            <i className="fa-solid fa-history text-5xl text-slate-200 mb-4"></i>
            <h3 className="text-xl font-bold text-slate-400">No Historical Records</h3>
            <p className="text-slate-400">All your maintenance history will be logged here for legal preservation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueHistory;
