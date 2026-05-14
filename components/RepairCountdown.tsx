import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';

interface Props {
    issueId: string;
    deadline: string | null | undefined;
    issueStatus?: string;
}

const RepairCountdown: React.FC<Props> = ({ issueId, deadline, issueStatus }) => {
    const { setIssues } = useApp();
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);
    const [hasEscalated, setHasEscalated] = useState(false);
    const [hasAttemptedEscalation, setHasAttemptedEscalation] = useState(false);

    const escalateIssue = useCallback(async () => {
        if (hasEscalated || hasAttemptedEscalation) return;
        
        setHasAttemptedEscalation(true);

        try {
            console.log(`Escalating issue ${issueId} due to expired deadline...`);
            const { error } = await supabase
                .from('issues')
                .update({ escalation_level: 2 })
                .eq('id', issueId);

            if (error) throw error;

            // Update local state
            setIssues(prev => prev.map(iss =>
                iss.id === issueId ? { ...iss, escalationLevel: 2 } : iss
            ));

            setHasEscalated(true);
        } catch (err) {
            console.error("Failed to auto-escalate issue:", err);
        }
    }, [issueId, hasEscalated, hasAttemptedEscalation, setIssues]);

    useEffect(() => {
        if (issueStatus === 'Resolved') {
            setTimeLeft('Issue Resolved');
            setIsExpired(false);
            return;
        }

        if (!deadline) {
            setTimeLeft('No deadline set');
            return;
        }

        const target = new Date(deadline).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('Deadline expired — escalation ready');
                if (!hasAttemptedEscalation) {
                    escalateIssue();
                }
                return;
            }

            const totalSeconds = Math.floor(diff / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${hours}h ${minutes}m ${seconds.toString().padStart(2, '0')}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [deadline, escalateIssue, hasAttemptedEscalation]);

    return (
        <div className={`text-xs font-bold ${isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
            <p className="uppercase tracking-widest text-[8px] opacity-70 mb-0.5">Time Remaining</p>
            <span className={isExpired ? 'animate-pulse' : ''}>{timeLeft}</span>
        </div>
    );
};

export default RepairCountdown;
