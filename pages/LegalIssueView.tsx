import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LegalIssueDetail from '../components/LegalIssueDetail';

const LegalIssueView: React.FC = () => {
    const { issueId } = useParams<{ issueId: string }>();
    const { issues, user, adminViewMode } = useApp();
    const navigate = useNavigate();

    const isAdmin = (user.role === 'admin' || user.role === 'superadmin' || user.role === 'legal_counsel') && adminViewMode === 'global';

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const issue = issues.find(i => i.id === issueId);

    if (!issue) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-black text-slate-800 mb-2">Issue Not Found</h2>
                <p className="text-slate-500 mb-6">The requested issue could not be found or you don't have access.</p>
                <button 
                    onClick={() => navigate('/timeline')}
                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
                >
                    Back to Timeline
                </button>
            </div>
        );
    }

    return (
        <LegalIssueDetail issue={issue} user={user} />
    );
};

export default LegalIssueView;
