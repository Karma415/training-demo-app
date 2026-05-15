import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import LegalDashboard from './pages/LegalDashboard';
import { supabase, supabaseConfig } from './services/supabase';
import IssueHistory from './pages/IssueHistory';
import Profile from './pages/Profile';
import Login from './pages/Login';
import DailyStaffInteractions from './components/DailyStaffInteractions';
import NotificationCenter from './components/NotificationCenter';
import TodoList from './components/TodoList';
import IssueDetail from './pages/IssueDetail';
import Timeline from './pages/Timeline';
import RecordsLibrary from './pages/RecordsLibrary';
import LegalIssueView from './pages/LegalIssueView';
import IssueHeatMap from './components/IssueHeatMap';

import InspectorPrep from './components/InspectorPrep';
import LegalAidDirectory from './components/LegalAidDirectory';
import LegalAidDetail from './pages/LegalAidDetail';
import LegalResourcesPlaceholder from './components/LegalResourcesPlaceholder';
import LegalResourceDetail from './pages/LegalResourceDetail';
import UniversityArticleDetail from './pages/UniversityArticleDetail';
import HousingUniversity from './pages/HousingUniversity';
import CalendarPage from './pages/CalendarPage';
import RentRelief from './components/RentRelief';
import LeaseDecoderPage from './pages/LeaseDecoderPage';
import TenantChecklist from './pages/TenantChecklist';
import AdminFileCabinet from './pages/AdminFileCabinet';
import LightweightSignup from './pages/LightweightSignup';
import LettersNotices from './pages/LettersNotices';
import { AuthProvider, useAuth } from './context/AuthContext';

const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === 'true' ||
  import.meta.env.VITE_APP_ENV === 'demo';

const DemoBanner: React.FC = () => {
  if (!isDemoMode) return null;

  return (
    <div className="sticky top-0 z-[100] bg-amber-300 text-slate-950 border-b border-amber-500 px-4 py-2 text-center text-xs sm:text-sm font-black uppercase tracking-[0.2em] shadow-sm">
      DEMO / TRAINING DATA
    </div>
  );
};

const ConfigurationErrorScreen: React.FC<{ missingVariables: string[] }> = ({ missingVariables }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white border border-rose-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-rose-600 text-white px-6 py-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-100">Configuration Error</p>
          <h1 className="text-2xl font-black mt-1">Missing Environment Variables</h1>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-slate-700 font-medium leading-relaxed">
            The app could not connect to Supabase because required Vite environment variables are missing or blank.
            Add the values to your local <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">.env</code> file,
            then restart the Vite dev server.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Missing values</p>
            <ul className="space-y-2">
              {missingVariables.map((variable) => (
                <li key={variable} className="font-mono text-sm text-rose-700 bg-white border border-rose-100 rounded-lg px-3 py-2">
                  {variable}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-sm overflow-x-auto">
            <div>VITE_SUPABASE_URL=https://your-project-ref.supabase.co</div>
            <div>VITE_SUPABASE_ANON_KEY=your-anon-public-key</div>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            This screen is shown instead of a white screen so setup issues are easier to diagnose.
          </p>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

import HelpVideo from './components/HelpVideo';

const isTenantProfileComplete = (user: ReturnType<typeof useApp>['user']) => {
  return Boolean(
    user.firstName?.trim() &&
    user.lastName?.trim() &&
    user.unit &&
    user.unit !== 'N/A' &&
    user.phone?.trim() &&
    user.monthlyRent &&
    user.monthlyRent > 0 &&
    user.moveInDate
  );
};

const MainLayout: React.FC = () => {
  const { user, logout,
    notifications,
    todos, setTodos,
    issues, interactionLogs, setInteractionLogs,
    adminViewMode,
    isProfileLoaded
  } = useApp();
  const { user: authUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasCompletedOnboarding = Boolean(authUser?.user_metadata?.onboarding_completed) || isTenantProfileComplete(user);

  if (authUser && !isProfileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={logout} />
      <HelpVideo />
      <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto scrollbar-hide min-w-0">
        <header className="flex justify-between items-center mb-8 sm:mb-12 border-b pb-4 sm:pb-6 border-slate-200 sticky top-0 bg-slate-50/80 backdrop-blur-md z-20">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-[#1e3a8a] flex items-center justify-center text-white shadow-md active:scale-95 transition-transform shrink-0"
              aria-label="Open menu"
            >
              <i className="fa-solid fa-bars text-lg"></i>
            </button>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg overflow-hidden bg-[#1e3a8a]">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <>{(user.firstName || user.name)?.charAt(0)}{user.lastName?.charAt(0) || ''}</>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unit {user.unit}</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right border-r pr-6 hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SF Rights Health</p>
              <p className="text-xs font-bold text-emerald-600 flex items-center"><i className="fa-solid fa-shield-halved mr-1"></i> Full Protections Active</p>
            </div>
            <div className="text-slate-300 font-black text-[10px] uppercase tracking-widest">SF Housing Hub</div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={
            ((user.role === 'admin' || user.role === 'superadmin') && adminViewMode === 'global') ? <Navigate to="/admin-dashboard" replace /> :
              user.role === 'legal_counsel' ? <Navigate to="/legal-dashboard" replace /> :
                (authUser?.user_metadata?.is_lightweight || user.is_lightweight) ? <Navigate to="/my-checklist" replace /> :
                (!hasCompletedOnboarding && (user.role === 'tenant' || user.role === 'resident' || !user.role)) ? <Navigate to="/onboarding" replace /> :
                  <Dashboard />
          } />
          <Route path="/admin-dashboard" element={
            ((user.role === 'admin' || user.role === 'superadmin') && adminViewMode === 'personal') ? <Navigate to="/" replace /> : <AdminDashboard />
          } />
          <Route path="/legal-dashboard" element={<LegalDashboard />} />
          <Route path="/issues" element={<IssueHistory />} />
          <Route path="/issues/:issueId" element={<IssueDetail />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/records" element={<RecordsLibrary />} />
          <Route path="/legal-issue/:issueId" element={<LegalIssueView />} />
          <Route path="/profile" element={<Profile />} />

          {/* Inline Wrappers for simple components */}
          <Route path="/comms" element={
            <DailyStaffInteractions
              logs={interactionLogs}
              issues={issues} // Added prop
              currentTenantId={user.id || user.name}
              onAdd={async (log) => {
                const newLog = {
                  id: 'log_' + Date.now(),
                  ...log,
                };
                setInteractionLogs([newLog, ...interactionLogs]);
                try {
                  const { error: sbError } = await supabase
                    .from('interactions')
                    .insert({
                      tenant_id: user.id,
                      staff_name: log.staffName,
                      staff_role: log.staffTitle,
                      interaction_type: log.interactionType,
                      topic: log.interactionCategory,
                      detailed_notes: log.detailedNotes,
                      promise_made: log.promiseMadeStatus === 'Yes',
                      promise_details: log.promiseMadeDetails,
                      follow_up_date: log.expectedFollowUpDates || null,
                      summary: log.summary,
                      issue_id: log.relatedIssueId || null,
                      created_at: log.timestamp ? new Date(log.timestamp).toISOString() : undefined
                    });

                  if (sbError) throw sbError;
                } catch (e) {
                  console.error("Failed to persist interaction:", e);
                }
              }}
            />
          } />
          {/* Removed TenantLounge route */}
          <Route path="/notifications" element={<NotificationCenter notifications={notifications} />} />

          <Route path="/todo" element={<TodoList todos={todos} onAdd={(t, d) => setTodos([{ id: Date.now().toString(), task: t, date: d, completed: false, status: 'To-Do' }, ...todos])} onToggle={(id) => setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))} onDelete={(id) => setTodos(todos.filter(t => t.id !== id))} />} />

          <Route path="/prep" element={<InspectorPrep activeIssues={issues.filter(i => i.status !== 'Resolved')} />} />
          <Route path="/heatmap" element={<IssueHeatMap issues={issues} />} />
          <Route path="/legal" element={<LegalResourcesPlaceholder />} />
          <Route path="/legal/:resourceId" element={<LegalResourceDetail />} />
          <Route path="/aid-directory" element={<LegalAidDirectory />} />
          <Route path="/aid-directory/:resourceId" element={<LegalAidDetail />} />
          <Route path="/university" element={<Navigate to="/university/ask-ai" replace />} />
          <Route path="/university/:section" element={<HousingUniversity />} />
          <Route path="/university/article/:articleId" element={<UniversityArticleDetail />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/rent-relief" element={<RentRelief />} />
          <Route path="/lease-decoder" element={<LeaseDecoderPage />} />
          <Route path="/my-checklist" element={<TenantChecklist />} />
          <Route path="/file-cabinet" element={<AdminFileCabinet />} />
          <Route path="/notices" element={<LettersNotices />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

import Onboarding from './pages/Onboarding';
import ResetPassword from './pages/ResetPassword';
import BugReportButton from './components/BugReportButton';

const App: React.FC = () => {
  if (!supabaseConfig.isConfigured) {
    return <ConfigurationErrorScreen missingVariables={supabaseConfig.missingEnvVars} />;
  }

  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <DemoBanner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<LightweightSignup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <MainLayout />
                <BugReportButton adminEmail="support@sfhousinghub.com" />
              </ProtectedRoute>
            } />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
