import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Users2,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Projects', icon: FolderKanban, path: '/projects' },
    { label: 'Student Planner', icon: CalendarDays, path: '/planner' },
    { label: 'Team Workload', icon: Users2, path: '/team' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-line flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-line gap-3">
          <div className="w-8 h-8 rounded-lg bg-ink-primary flex items-center justify-center text-white shadow-ambient">
            <Target className="w-4 h-4 text-brand-100" />
          </div>
          <div>
            <span className="font-bold text-ink-primary tracking-tight text-base">PlanPulse</span>
            <span className="block text-[10px] text-ink-muted uppercase tracking-wider font-semibold">
              Project & Study OS
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-ink-primary shadow-ambient font-semibold'
                      : 'text-ink-secondary hover:bg-canvas-subtle hover:text-ink-primary'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-ink-muted" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            );
          })}
        </nav>

        {/* Focus Sprint Micro-Widget */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-canvas-subtle border border-line">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span className="text-xs font-semibold text-ink-primary">AI Priority Engine</span>
          </div>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Multi-factor scoring active: ranking tasks by deadline, effort & study limits.
          </p>
        </div>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-line">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-canvas-subtle transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-line flex items-center justify-center font-bold text-xs text-ink-primary shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-ink-primary truncate">{user?.name || 'Student Member'}</p>
                <p className="text-[10px] text-ink-muted capitalize truncate">{user?.role || 'student'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-ink-muted hover:text-rose-600 p-1.5 rounded-md hover:bg-white transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
