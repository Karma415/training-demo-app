
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Repeat, X } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, isOpen, onClose }) => {
  const { user, adminViewMode, setAdminViewMode } = useApp();
  const { user: authUser } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isAttorney = user?.role === 'legal_counsel';
  const isLightweight = authUser?.user_metadata?.is_lightweight || user?.is_lightweight;

  const defaultTopNavItems = [
    { id: '', label: 'Dashboard', icon: 'fa-gauge-high' },
    { id: 'my-checklist', label: 'My Checklist', icon: 'fa-clipboard-list' },
    { id: 'records', label: 'Records Library', icon: 'fa-folder-open' },
    { id: 'issues', label: 'All Issues Reported', icon: 'fa-box-archive' },
    { id: 'notices', label: 'Letters & Notices', icon: 'fa-envelope-open-text' },
    { id: 'timeline', label: 'Exact Timeline', icon: 'fa-timeline' },
    { id: 'comms', label: 'Communication Log', icon: 'fa-comments' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
  ];

  const adminTopNavItems = [
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: 'fa-shield-halved' },
    { id: 'file-cabinet', label: 'File Cabinet', icon: 'fa-folder-tree' },
    { id: 'notices', label: 'Letters & Notices', icon: 'fa-envelope-open-text' },
    { id: 'records', label: 'Records Library', icon: 'fa-folder-open' },
    { id: 'timeline', label: 'Building Timeline', icon: 'fa-timeline' }
  ];

  const attorneyTopNavItems = [
    { id: 'legal-dashboard', label: 'Legal Dashboard', icon: 'fa-scale-balanced' },
    { id: 'file-cabinet', label: 'File Cabinet', icon: 'fa-folder-tree' },
    { id: 'notices', label: 'Letters & Notices', icon: 'fa-envelope-open-text' },
    { id: 'records', label: 'Records Library', icon: 'fa-folder-open' },
    { id: 'timeline', label: 'Building Timeline', icon: 'fa-timeline' }
  ];

  const lightweightNavItems = [
    { id: 'my-checklist', label: 'My Checklist', icon: 'fa-clipboard-list' },
    { id: 'notices', label: 'Letters & Notices', icon: 'fa-envelope-open-text' },
    { id: 'records', label: 'Records Library', icon: 'fa-folder-open' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
  ];

  const topNavItems = (isAdmin && adminViewMode === 'global') ? adminTopNavItems : (isAttorney ? attorneyTopNavItems : (isLightweight ? lightweightNavItems : defaultTopNavItems));

  const toolItems = [
    { id: 'rent-relief', label: 'Rent Relief', icon: 'fa-hand-holding-dollar' },
    { id: 'lease-decoder', label: 'Lease Decoder', icon: 'fa-file-signature' },
  ];

  const organizingItems: any[] = (isAdmin || isAttorney) ? [
    { id: 'heatmap', label: 'Building Heat Map', icon: 'fa-map' }
  ] : [];

  const legalItems = [
    { id: 'legal', label: 'Legal Resources', icon: 'fa-scale-balanced' },
    { id: 'aid-directory', label: 'Aid Directory', icon: 'fa-address-book' },
  ];

  const universityItems = [
    { id: 'university/jargon', label: 'Legal Jargon Dictionary', icon: 'fa-book' },
    { id: 'university/articles', label: 'Articles & Guides', icon: 'fa-book-open' },
    { id: 'university/ask-ai', label: 'Ask AI', icon: 'fa-robot' },
  ];

  const renderLink = (id: string, label: string, icon: string) => (
    <NavLink
      key={id}
      to={`/${id}`}
      onClick={onClose}
      className={({ isActive }) => `w-full flex items-center space-x-3 px-6 py-3 transition-colors ${isActive
          ? 'bg-blue-900 border-r-4 border-blue-400 text-white'
          : 'text-blue-100 hover:bg-blue-800 hover:text-white'
        }`}
      end={id === '' || id === 'admin-dashboard'}
    >
      <i className={`fa-solid ${icon} w-5 text-center`}></i>
      <span className="font-medium text-sm">{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-[#1e3a8a] text-white min-h-screen flex flex-col shadow-xl z-50
        fixed lg:sticky top-0 shrink-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center space-x-3">
            <i className="fa-solid fa-building-circle-check text-2xl text-blue-300"></i>
            <span className="text-xl font-bold tracking-tight">SF Housing Hub</span>
          </div>
          {/* Close button — only visible on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center text-blue-200 hover:text-white hover:bg-blue-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto pb-20 scrollbar-hide">
          {isAdmin && (
            <div className="px-5 mb-6">
              <button 
                onClick={() => setAdminViewMode(adminViewMode === 'global' ? 'personal' : 'global')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border ${
                  adminViewMode === 'global' 
                    ? 'bg-indigo-900/50 border-indigo-500/50 text-indigo-200' 
                    : 'bg-emerald-900/50 border-emerald-500/50 text-emerald-200'
                } hover:brightness-110 transition-all font-bold text-xs shadow-sm`}
              >
                <div className="flex items-center space-x-2">
                  <i className={`fa-solid ${adminViewMode === 'global' ? 'fa-shield-halved' : 'fa-user'} w-4 text-center`}></i>
                  <span>{adminViewMode === 'global' ? 'Admin Account' : 'Personal Account'}</span>
                </div>
                <Repeat className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>
          )}

          <p className="px-6 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Main</p>
          {topNavItems.map(item => renderLink(item.id, item.label, item.icon))}

          {!isLightweight && !isAttorney && (
            <>
              <p className="px-6 text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-6 mb-2">Intelligence & Aid</p>
              {toolItems.map(item => renderLink(item.id, item.label, item.icon))}
            </>
          )}

          {!isLightweight && organizingItems.length > 0 && (
            <>
              <p className="px-6 text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-6 mb-2">Organizing</p>
              {organizingItems.map(item => renderLink(item.id, item.label, item.icon))}
            </>
          )}

          {!isAttorney && (
            <>
              <p className="px-6 text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-6 mb-2">Legal Support</p>
              {legalItems.map(item => renderLink(item.id, item.label, item.icon))}
            </>
          )}

          <p className="px-6 text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-6 mb-2">SF Housing University</p>
          {universityItems
             .filter(item => !isAttorney || item.id === 'university/articles')
             .map(item => renderLink(item.id, item.label, item.icon))}
        </nav>

        <div className="mt-auto border-t border-blue-800 pt-2 pb-4 bg-[#1e3a8a]">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) => `w-full flex items-center space-x-3 px-6 py-4 transition-colors ${isActive
                ? 'bg-blue-900 border-r-4 border-blue-400 text-white'
                : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
          >
            <i className="fa-solid fa-user-gear w-5 text-center"></i>
            <span className="font-medium">Account Settings</span>
          </NavLink>
          <button
            onClick={() => { onClose(); onLogout(); }}
            className="w-full flex items-center space-x-3 px-6 py-4 text-red-300 hover:bg-red-900/30 hover:text-red-100 transition-colors"
          >
            <i className="fa-solid fa-right-from-bracket w-5 text-center"></i>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
