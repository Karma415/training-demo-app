
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Issue, Tenant, Communication, Notification, Todo, DBIComplaint, BuildingRedactedIssue, InteractionLogEntry, LegalNotice, HabitabilityRule } from '../types';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface AppContextType {
    user: Tenant;
    setUser: React.Dispatch<React.SetStateAction<Tenant>>;
    issues: Issue[];
    setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
    communications: Communication[];
    setCommunications: React.Dispatch<React.SetStateAction<Communication[]>>;
    notifications: Notification[];
    todos: Todo[];
    setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
    dbiComplaints: DBIComplaint[];
    setDbiComplaints: React.Dispatch<React.SetStateAction<DBIComplaint[]>>;
    interactionLogs: InteractionLogEntry[];
    setInteractionLogs: React.Dispatch<React.SetStateAction<InteractionLogEntry[]>>;
    legalNotices: LegalNotice[];
    setLegalNotices: React.Dispatch<React.SetStateAction<LegalNotice[]>>;
    tenants: any[];
    setTenants: React.Dispatch<React.SetStateAction<any[]>>;
    habitabilityRules: HabitabilityRule[];
    buildingIssues: BuildingRedactedIssue[];
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, unit: string) => Promise<void>;
    logout: () => void;
    fetchIssues: (uid?: string, role?: string) => Promise<void>;
    refetchUser: () => Promise<void>;
    adminViewMode: 'personal' | 'global';
    setAdminViewMode: React.Dispatch<React.SetStateAction<'personal' | 'global'>>;
    isProfileLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: authUser } = useAuth();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isProfileLoaded, setIsProfileLoaded] = useState(false);
    const navigate = useNavigate();

    const [user, setUser] = useState<Tenant>({
        id: 'user_1', // Blank initially to avoid UUID errors
        name: '',
        unit: '',
        email: '',
        phone: '',
        monthlyRent: 0,
        moveInDate: '',
        leaseAnalyzed: false
    });

    const [issues, setIssues] = useState<Issue[]>([]);
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [dbiComplaints, setDbiComplaints] = useState<DBIComplaint[]>([]);
    const [legalNotices, setLegalNotices] = useState<LegalNotice[]>([]);
    const [interactionLogs, setInteractionLogs] = useState<InteractionLogEntry[]>([]);
    const [habitabilityRules, setHabitabilityRules] = useState<HabitabilityRule[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: 'n1',
            type: 'alert',
            title: 'Urgent: Water Leak in 402',
            content: 'Unresolved leak reported 14 days ago. Escalate to DBI now.',
            timestamp: new Date().toISOString(),
            read: false,
            urgency: 'High',
            purpose: 'Legal Escalation Tracker',
            sender: 'System Protocol',
            status: 'Pending Review'
        },
        {
            id: 'n2',
            type: 'update',
            title: 'Rent Board Hearing Scheduled',
            content: 'Case 2024-X-982 is set for next Tuesday at 9:00 AM.',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            read: false,
            urgency: 'Medium',
            purpose: 'Case Management',
            sender: 'SF Rent Board API',
            status: 'Confirmed'
        }
    ]);
    const [adminViewMode, setAdminViewMode] = useState<'personal' | 'global'>('global');
    const [todos, setTodos] = useState<Todo[]>([
        {
            id: 't1',
            task: 'Send 24-hr Demand Letter for Heating',
            tenantUID: 'user_1',
            date: new Date().toISOString(),
            status: 'To-Do',
            completed: false,
            deadline: new Date(Date.now() + 86400000).toISOString(),
            notes: 'Requires signature from tenant in Unit 305'
        },
        {
            id: 't2',
            task: 'Follow up on DBI Report #10293',
            tenantUID: 'user_1',
            date: new Date().toISOString(),
            status: 'To-Do',
            completed: false,
            deadline: new Date(Date.now() + 172800000).toISOString(),
            notes: 'Check online portal for inspector assignment'
        }
    ]);
    const [buildingIssues] = useState<BuildingRedactedIssue[]>([
        { id: 'b1', floor: 4, category: 'Plumbing', status: 'Reported', dateStarted: '2024-05-20' },
    ]);

    const fetchIssues = useCallback(async (uid?: string, role?: string) => {
        const queryUid = uid || authUser?.id;
        let queryRole = role || user.role;
        
        if (queryRole === 'admin' || queryRole === 'superadmin') {
            if (adminViewMode === 'personal') {
                queryRole = 'tenant';
            }
        }

        if (!queryUid) return;

        console.log(`Fetching issues for UID: ${queryUid}, Role: ${queryRole}`);
        try {
            let query = supabase
                .from("issues")
                .select("*")
                .order('created_at', { ascending: false });

            if (queryRole !== 'admin' && queryRole !== 'superadmin' && queryRole !== 'legal_counsel') {
                query = query.eq("tenant_id", queryUid);
            }

            const { data: issueList, error: issueError } = await query;

            if (issueError) throw issueError;

            if (issueList) {
                const mappedIssues = issueList.map((iss: any) => {
                    const parsedDate = iss.date_reported && !iss.date_reported.includes('T') ? `${iss.date_reported}T12:00:00Z` : iss.date_reported;
                    return {
                        id: iss.id,
                        tenantId: iss.tenant_id,
                        tenantUID: iss.tenant_id,
                        category: iss.category,
                        ruleId: iss.issue_category_id,
                        rule: iss.rule || null,
                        description: iss.description,
                        dateStarted: parsedDate,
                        managementMethod: iss.management_method,
                        managementResponse: iss.management_response,
                        status: iss.status ? iss.status.charAt(0).toUpperCase() + iss.status.slice(1) : 'Reported',
                        daysSinceReported: Math.floor((new Date().getTime() - new Date(parsedDate).getTime()) / (1000 * 3600 * 24)),
                        hasGivenNotice: !!iss.management_method,
                        evidence: [],
                        escalationLevel: iss.escalation_level || 0,
                        repairDeadline: iss.repair_deadline || iss.deadline
                    };
                });
                setIssues(mappedIssues);
            }
        } catch (error) {
            console.error("Error fetching issues from Supabase:", error);
        }
    }, [authUser?.id, user.role, adminViewMode]);

    useEffect(() => {
        const computeNotifications = async () => {
            if (!user.id) return;
            
            const newNotifications: Notification[] = [];

            // 1. Repair Deadlines from issues
            issues.forEach(iss => {
                if (iss.status !== 'Resolved' && iss.repairDeadline) {
                    const daysLeft = Math.ceil((new Date(iss.repairDeadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    if (daysLeft >= 0 && daysLeft <= 3) {
                        newNotifications.push({
                            id: `deadline-${iss.id}`,
                            title: `Repair Deadline Approaching: ${iss.category}`,
                            content: `The legal deadline to repair your reported issue is ${daysLeft === 0 ? 'TODAY' : `in ${daysLeft} days`} (${new Date(iss.repairDeadline).toLocaleDateString()}).`,
                            timestamp: new Date().toISOString(),
                            type: 'alert',
                            sender: 'Compliance Engine',
                            read: false,
                            urgency: daysLeft === 0 ? 'High' : 'Medium',
                            purpose: 'repair_deadline',
                            status: 'active'
                        });
                    } else if (daysLeft < 0) {
                        newNotifications.push({
                            id: `deadline-expired-${iss.id}`,
                            title: `Repair Deadline EXPIRED: ${iss.category}`,
                            content: `The legal deadline expired ${Math.abs(daysLeft)} days ago. You can now escalate this issue.`,
                            timestamp: new Date().toISOString(),
                            type: 'alert',
                            sender: 'Compliance Engine',
                            read: false,
                            urgency: 'High',
                            purpose: 'deadline_expired',
                            status: 'active'
                        });
                    }
                }
            });

            // 2. Fetch Calendar Events
            try {
                const today = new Date().toISOString().split('T')[0];
                const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
                
                let query = supabase
                    .from('calendar_events')
                    .select('*')
                    .gte('event_date', today)
                    .lte('event_date', nextWeek);
                    
                const effectiveRole = (user.role === 'admin' || user.role === 'superadmin') && adminViewMode === 'personal' ? 'tenant' : user.role;

                if (effectiveRole === 'admin' || effectiveRole === 'superadmin') {
                    const { data: pendingEvents } = await supabase
                        .from('calendar_events')
                        .select('*')
                        .eq('is_global', true)
                        .eq('approved_by_admin', false);
                        
                    if (pendingEvents && pendingEvents.length > 0) {
                        newNotifications.push({
                            id: `pending-events`,
                            title: `Pending Calendar Approvals`,
                            content: `There are ${pendingEvents.length} tenant events waiting for your approval to be posted globally.`,
                            timestamp: new Date().toISOString(),
                            type: 'message',
                            sender: 'Calendar System',
                            read: false,
                            urgency: 'High',
                            purpose: 'approval_required',
                            status: 'active'
                        });
                    }
                } else {
                    query = query.eq('is_global', true).eq('approved_by_admin', true);
                    const { data: upcomingEvents } = await query;
                    
                    if (upcomingEvents) {
                        upcomingEvents.forEach(evt => {
                            newNotifications.push({
                                id: `event-${evt.id}`,
                                title: `Upcoming Event: ${evt.title}`,
                                content: `${evt.description || 'Join your community for this event'} on ${evt.event_date} at ${evt.event_time || 'TBD'}.`,
                                timestamp: new Date(evt.event_date).toISOString(),
                                type: 'message',
                                sender: 'Building Admin',
                                read: false,
                                urgency: 'Low',
                                purpose: 'event_reminder',
                                status: 'active'
                            });
                        });
                    }
                }
            } catch (err) {
                 console.error("Failed fetching calendar events for notifications", err);
            }
            
            newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setNotifications(newNotifications);
        };
        
        computeNotifications();
    }, [issues, user.id, user.role, adminViewMode]);

    const refetchUser = useCallback(async () => {
        const uid = authUser?.id;
        if (!uid) return;
        console.log("Fetching tenant profile from Supabase for UID:", uid);

        try {
            // 1. Fetch all tenants (to sync with the current list)
            const { data: tenantList, error: tenantError } = await supabase
                .from("tenants")
                .select("*");

            if (tenantError) throw tenantError;

            let currentRole = 'tenant';
            if (tenantList) {
                const mappedTenants = tenantList.map(t => ({
                    id: t.id,
                    supabaseId: t.id,
                    name: `${t.first_name} ${t.last_name}`,
                    firstName: t.first_name,
                    lastName: t.last_name,
                    unit: t.unit_number ? t.unit_number.toString() : 'N/A',
                    email: t.email,
                    phone: t.phone,
                    monthlyRent: t.monthly_rent || 0,
                    status: t.status,
                    role: t.role as any,
                    moveInDate: t.created_at,
                    leaseAnalyzed: false,
                    avatarUrl: t.avatar_url || undefined,
                    requestsAttorney: t.requests_attorney || false,
                    temporaryUnit: t.temporary_unit?.toString(),
                    temporaryMoveInDate: t.temp_move_in_date,
                    temporaryMoveOutDate: t.temp_move_out_date
                }));
                setTenants(mappedTenants);

                // 2. Find current user profile
                const currentUser = mappedTenants.find(t => t.id === uid);
                if (currentUser) {
                    currentRole = currentUser.role || 'tenant';
                    setUser({
                        id: currentUser.id,
                        supabaseId: currentUser.id,
                        name: currentUser.name,
                        firstName: currentUser.firstName,
                        lastName: currentUser.lastName,
                        unit: currentUser.unit,
                        email: currentUser.email,
                        phone: currentUser.phone,
                        monthlyRent: Number(currentUser.monthlyRent) || 0,
                        status: currentUser.status,
                        role: currentRole as any,
                        moveInDate: currentUser.moveInDate,
                        leaseAnalyzed: false,
                        avatarUrl: currentUser.avatarUrl,
                        requestsAttorney: currentUser.requestsAttorney,
                        temporaryUnit: currentUser.temporaryUnit,
                        temporaryMoveInDate: currentUser.temporaryMoveInDate,
                        temporaryMoveOutDate: currentUser.temporaryMoveOutDate
                    });
                }
            }

            // 3. Fetch Issues
            await fetchIssues(uid, currentRole);

            // 4. Fetch Tasks
            const { data: taskList, error: taskError } = await supabase
                .from("tasks")
                .select("*")
                .eq("tenant_id", uid);

            if (taskError) throw taskError;

            if (taskList) {
                const mappedTasks = taskList.map((t: any) => ({
                    id: t.id,
                    task: t.description,
                    tenantUID: t.tenant_id,
                    relatedIssueId: t.issue_id,
                    date: t.created_at,
                    status: (t.status === 'to_do' ? 'To-Do' : (t.status === 'in_progress' ? 'In-Progress' : 'Done')) as 'In-Progress' | 'To-Do' | 'Done',
                    completed: t.completed,
                    deadline: t.due_date,
                }));
                setTodos(mappedTasks);
            }

            // 5. Fetch Legal Notices
            const { data: noticesList, error: noticesError } = await supabase
                .from("legal_notices")
                .select("*")
                .eq("tenant_id", uid);

            if (noticesError) throw noticesError;

            if (noticesList) {
                const mappedNotices = noticesList.map((n: any) => ({
                    id: n.id,
                    relatedIssueId: n.issue_id,
                    templateType: n.notice_type, // Assuming notice_type maps to templateType
                    dateSent: n.sent_at,
                    content: n.content,
                    recipient: 'THC', // Default or fetch if stored
                    status: 'Sent'
                }));
                setLegalNotices(mappedNotices as any);
            }

            const effectiveRole = (currentRole === 'admin' || currentRole === 'superadmin' || currentRole === 'legal_counsel') && adminViewMode === 'global' ? 'admin' : currentRole;

            // 6. Fetch Interaction Logs
            let logsQuery = supabase
                .from("interactions")
                .select("*");
                
            if (effectiveRole !== 'admin' && effectiveRole !== 'superadmin' && effectiveRole !== 'legal_counsel') {
                logsQuery = logsQuery.eq("tenant_id", uid);
            }

            const { data: logsList, error: logsError } = await logsQuery;

            if (logsError) throw logsError;

            if (logsList) {
                const mappedLogs = logsList.map((l: any) => ({
                    id: l.id,
                    staffName: l.staff_name,
                    staffRole: l.staff_role,
                    interactionType: l.interaction_type,
                    interactionCategory: Array.isArray(l.topic) ? l.topic : (l.topic ? l.topic.split(',').map((s: string) => s.trim()) : []),
                    detailedNotes: l.detailed_notes,
                    promiseMadeStatus: l.promise_made ? 'Yes' : 'No',
                    promiseMadeDetails: l.promise_details,
                    followUpDate: l.follow_up_date,
                    timestamp: l.created_at,
                    relatedIssueId: l.issue_id,
                    tenantId: l.tenant_id // added so Timeline can resolve tenant info
                }));
                setInteractionLogs(mappedLogs as any);
            }
        } catch (error) {
            console.error("Error fetching data from Supabase:", error);
        }
        // 6. Fetch Global Habitability Rules (Cache for form use)
        try {
            const { data: rulesData, error: rulesError } = await supabase
                .from('habitability_rules')
                .select('*');
            if (rulesError) {
                console.error("Error fetching rules:", rulesError);
            } else if (rulesData) {
                setHabitabilityRules(rulesData);
            }
        } catch (err) {
            console.error("Rules fetch failed:", err);
        } finally {
            setIsProfileLoaded(true);
        }

    }, [authUser?.id, fetchIssues, adminViewMode]);

    useEffect(() => {
        const fetchGlobalData = async () => {
            try {
                const { data: rulesList, error: rulesError } = await supabase
                    .from("habitability_rules")
                    .select("*");
                if (!rulesError && rulesList) {
                    setHabitabilityRules(rulesList);
                } else {
                    console.error("Failed to fetch habitability rules:", rulesError);
                }
            } catch (err) {
                console.error("Exception fetching global data:", err);
            }
        };

        fetchGlobalData();

        if (authUser?.id) { // Ensure we have a valid UUID from Supabase Auth
            setIsLoggedIn(true);
            setIsProfileLoaded(false); // <--- Wait for profile to load
            refetchUser();
        } else {
            setIsLoggedIn(false);
            setIsProfileLoaded(false); // <--- Reset on logout
            setTenants([]);
            setIssues([]);
            setTodos([]);
            setUser({
                id: '',
                name: '',
                unit: '',
                email: '',
                phone: '',
                monthlyRent: 0,
                moveInDate: '',
                leaseAnalyzed: false
            });
        }
    }, [authUser?.id, refetchUser]);

    const signUp = async (email: string, password: string, name: string, unit: string) => {
        console.log("Attempting Supabase sign up");
        
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    unit_number: unit
                }
            }
        });

        if (error) {
            console.error("Sign up error:", error.message);
            throw error;
        }

        console.log("Sign up successful:", data);
        navigate('/onboarding');
    };

    const login = async (email: string, password: string) => {
        console.log("Attempting Supabase login");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login error:", error.message);
            throw error;
        }

        console.log("Login successful:", data);

        const { data: sessionData } = await supabase.auth.getSession();
        console.log("SESSION AFTER LOGIN:", sessionData.session);

        navigate('/');
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AppContext.Provider value={{
            user, setUser,
            issues, setIssues,
            communications, setCommunications,
            notifications,
            todos, setTodos,
            dbiComplaints, setDbiComplaints,
            legalNotices, setLegalNotices,
            interactionLogs, setInteractionLogs,
            tenants, setTenants,
            buildingIssues,
            habitabilityRules,
            isLoggedIn,
            login, signUp, logout,
            fetchIssues,
            refetchUser,
            adminViewMode, setAdminViewMode,
            isProfileLoaded
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
