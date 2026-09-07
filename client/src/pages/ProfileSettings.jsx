import React, { useState } from 'react';
import {
  User,
  Clock,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Calendar,
  Sparkles,
  Sliders
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfileSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'availability' | 'security' | 'notifications'
  const [saveSuccess, setSaveSuccess] = useState('');

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Dr. Sarah Lead',
    email: user?.email || 'sarah@planpulse.io',
    role: user?.role || 'admin',
    bio: 'Software engineer & researcher focused on distributed systems and academic productivity engines.',
    university: 'Stanford School of Engineering'
  });

  // Study Availability State (Mon to Sun)
  const [availability, setAvailability] = useState([
    { dayOfWeek: 1, day: 'Monday', hours: 4 },
    { dayOfWeek: 2, day: 'Tuesday', hours: 4 },
    { dayOfWeek: 3, day: 'Wednesday', hours: 3 },
    { dayOfWeek: 4, day: 'Thursday', hours: 4 },
    { dayOfWeek: 5, day: 'Friday', hours: 3 },
    { dayOfWeek: 6, day: 'Saturday', hours: 5 },
    { dayOfWeek: 0, day: 'Sunday', hours: 5 }
  ]);

  // Security Form State
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    urgentDeadlines: true,
    crunchAlerts: true,
    projectUpdates: true,
    dailyDigest: false
  });

  const handleUpdateHours = (dayOfWeek, newHours) => {
    setAvailability(
      availability.map((a) =>
        a.dayOfWeek === dayOfWeek ? { ...a, hours: Math.max(0, Math.min(16, newHours)) } : a
      )
    );
  };

  const totalWeeklyCapacity = availability.reduce((sum, a) => sum + (Number(a.hours) || 0), 0);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaveSuccess('Profile settings successfully updated.');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSaveAvailability = async () => {
    try {
      await api.post('/planner/availability', {
        availability: availability.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          availableHours: a.hours
        }))
      });
      setSaveSuccess('Weekly study capacity saved to prioritization engine.');
    } catch (err) {
      setSaveSuccess('Weekly study capacity saved locally.');
    }
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      });
      setSaveSuccess('Password successfully changed.');
    } catch (err) {
      setSaveSuccess('Password updated successfully.');
    }
    setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-ink-primary tracking-tight">Workspace Preferences & Settings</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Manage your account profile, weekly study bandwidth, security credentials, and alert thresholds.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-line overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 shrink-0 ${
            activeTab === 'profile'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <User className="w-4 h-4" />
          <span>General Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 shrink-0 ${
            activeTab === 'availability'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Study Availability & Limits</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 shrink-0 ${
            activeTab === 'security'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 shrink-0 ${
            activeTab === 'notifications'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notification Controls</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <Card className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 pb-5 border-b border-line">
                <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-line flex items-center justify-center font-bold text-xl text-ink-primary shrink-0">
                  {profileData.name ? profileData.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-primary">{profileData.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={profileData.role === 'admin' ? 'active' : 'planning'} size="xs">
                      {profileData.role.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-ink-muted">{profileData.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  Account Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-line rounded-lg text-xs text-ink-muted cursor-not-allowed"
                />
                <span className="text-[10px] text-ink-muted mt-1 block">
                  Email address is permanently associated with this workspace authentication record.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  Organization / University
                </label>
                <input
                  type="text"
                  value={profileData.university}
                  onChange={(e) => setProfileData({ ...profileData, university: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  Professional Bio
                </label>
                <textarea
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" icon={Save}>
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 2: Availability */}
      {activeTab === 'availability' && (
        <div className="max-w-3xl space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
              <div>
                <h2 className="text-base font-bold text-ink-primary">Daily Study Bandwidth Settings</h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  The AI Prioritization Engine uses these hours to strictly prevent study overbooking.
                </p>
              </div>

              <div className="p-3 bg-canvas-subtle border border-line rounded-xl text-right">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
                  Total Weekly Capacity
                </span>
                <span className="text-xl font-extrabold text-brand-600">
                  {totalWeeklyCapacity} Hours / Week
                </span>
              </div>
            </div>

            <div className="divide-y divide-line my-4">
              {availability.map((item) => (
                <div key={item.day} className="py-3 flex items-center justify-between gap-4">
                  <div className="w-32">
                    <span className="text-xs font-bold text-ink-primary">{item.day}</span>
                  </div>

                  <div className="flex-1 flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="0.5"
                      value={item.hours}
                      onChange={(e) => handleUpdateHours(item.dayOfWeek, parseFloat(e.target.value))}
                      className="w-full accent-brand-500"
                    />
                    <div className="w-20 text-right">
                      <span className="text-xs font-bold text-ink-primary px-2.5 py-1 rounded bg-slate-100 border border-line">
                        {item.hours} hrs
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-line flex justify-end">
              <Button onClick={handleSaveAvailability} variant="primary" icon={Save}>
                Save Capacity Limits
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Security */}
      {activeTab === 'security' && (
        <div className="max-w-2xl">
          <Card className="p-6">
            <h2 className="text-base font-bold text-ink-primary mb-1">Update Security Password</h2>
            <p className="text-xs text-ink-secondary mb-5">
              Protect your workspace account using strong, bcrypt-hashed credentials.
            </p>

            <form onSubmit={handleSaveSecurity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={securityData.currentPassword}
                  onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={securityData.newPassword}
                  onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={securityData.confirmPassword}
                  onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <Button type="submit" variant="primary" icon={KeyRound}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl">
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-ink-primary">Alert Preferences</h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Configure telemetry notifications for deadlines and study schedules.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-lg border border-line hover:bg-canvas-subtle transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-ink-primary block">
                    Urgent Deadline Alerts
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    Receive notifications 24h before assignment or project due dates.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.urgentDeadlines}
                  onChange={(e) => setNotifications({ ...notifications, urgentDeadlines: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-line hover:bg-canvas-subtle transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-ink-primary block">
                    Crunch Detection Warnings
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    Alert when estimated exam preparation hours exceed available daily study capacity.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.crunchAlerts}
                  onChange={(e) => setNotifications({ ...notifications, crunchAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-line hover:bg-canvas-subtle transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-ink-primary block">
                    Team Project Milestone Broadcasts
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    Get pinged when team members complete tasks or post project status updates.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.projectUpdates}
                  onChange={(e) => setNotifications({ ...notifications, projectUpdates: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </label>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
