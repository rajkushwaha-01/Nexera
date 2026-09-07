import React, { useState } from 'react';
import { Search, Bell, Menu, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';

const Topbar = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'Exam in 20 hours',
      desc: 'Quantum Mechanics Quiz scheduled tomorrow morning',
      type: 'critical',
      time: '10m ago',
    },
    {
      id: 2,
      title: 'Project Status Update',
      desc: 'Sprint 2 deliverables marked on track by Dr. Sarah Lead',
      type: 'info',
      time: '1h ago',
    },
    {
      id: 3,
      title: 'Schedule Synchronized',
      desc: '3 hours allocated today without study time overbooking',
      type: 'success',
      time: '3h ago',
    },
  ];

  return (
    <header className="h-16 bg-white/90 backdrop-blur-sm border-b border-line px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-canvas-subtle lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, tasks, or study topics... (⌘K)"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-canvas-subtle border border-line rounded-lg text-ink-primary placeholder:text-ink-faint focus:outline-none focus:bg-white focus:border-line-strong transition-colors"
          />
        </div>
      </div>

      {/* Center Semester Indicator */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-canvas-subtle border border-line text-xs text-ink-secondary">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium text-ink-primary">Fall Semester 2024</span>
        <span className="text-ink-faint">•</span>
        <span className="text-ink-muted">Week 7 Sprint</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-canvas-subtle transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-line rounded-xl shadow-ambient-lg p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                <span className="text-xs font-semibold text-ink-primary">Notifications</span>
                <span className="text-[11px] text-ink-muted">3 new</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 rounded-lg hover:bg-canvas-subtle transition-colors border border-transparent hover:border-line text-left"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-medium text-ink-primary">{n.title}</p>
                      <span className="text-[10px] text-ink-faint">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-2">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Role Pill */}
        <Badge variant="default" size="sm" className="hidden sm:inline-flex capitalize">
          {user?.role || 'Student'}
        </Badge>
      </div>
    </header>
  );
};

export default Topbar;
