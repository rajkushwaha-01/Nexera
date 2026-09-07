import React, { useState, useEffect } from 'react';
import {
  Users2,
  FolderKanban,
  CheckCircle2,
  Clock,
  Briefcase,
  Search,
  UserPlus,
  ShieldCheck,
  TrendingUp,
  Activity
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import api from '../services/api';

const DEFAULT_TEAM_MEMBERS = [
  {
    _id: 'u1',
    name: 'Dr. Sarah Lead',
    email: 'sarah@planpulse.io',
    role: 'admin',
    assignedProjectsCount: 3,
    activeTasksCount: 4,
    completedTasksCount: 16,
    totalEstimatedHours: 24,
    totalActualHours: 22,
    status: 'Optimal Load'
  },
  {
    _id: 'u2',
    name: 'Kevin Dev',
    email: 'kevin@planpulse.io',
    role: 'member',
    assignedProjectsCount: 2,
    activeTasksCount: 5,
    completedTasksCount: 12,
    totalEstimatedHours: 28,
    totalActualHours: 25,
    status: 'Optimal Load'
  },
  {
    _id: 'u3',
    name: 'Maya Chen',
    email: 'maya@planpulse.io',
    role: 'member',
    assignedProjectsCount: 2,
    activeTasksCount: 6,
    completedTasksCount: 9,
    totalEstimatedHours: 32,
    totalActualHours: 28,
    status: 'High Load'
  },
  {
    _id: 'u4',
    name: 'Alex Student',
    email: 'alex@planpulse.io',
    role: 'student',
    assignedProjectsCount: 1,
    activeTasksCount: 3,
    completedTasksCount: 7,
    totalEstimatedHours: 16,
    totalActualHours: 14,
    status: 'Balanced'
  },
  {
    _id: 'u5',
    name: 'David Miller',
    email: 'david@planpulse.io',
    role: 'member',
    assignedProjectsCount: 1,
    activeTasksCount: 2,
    completedTasksCount: 8,
    totalEstimatedHours: 12,
    totalActualHours: 10,
    status: 'Balanced'
  }
];

const TeamWorkload = () => {
  const [teamMembers, setTeamMembers] = useState(DEFAULT_TEAM_MEMBERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New member form
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'member'
  });

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const res = await api.get('/team/members');
      if (res.data?.data && res.data.data.length > 0) {
        setTeamMembers(res.data.data);
      }
    } catch (err) {
      // Keep rich demo data
    }
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;

    const added = {
      _id: 'u_' + Date.now(),
      name: newMember.name,
      email: newMember.email || `${newMember.name.toLowerCase().replace(' ', '')}@planpulse.io`,
      role: newMember.role,
      assignedProjectsCount: 1,
      activeTasksCount: 0,
      completedTasksCount: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
      status: 'Available'
    };

    setTeamMembers([...teamMembers, added]);
    setIsAddModalOpen(false);
    setNewMember({ name: '', email: '', role: 'member' });
  };

  const filteredMembers = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalActiveTasks = teamMembers.reduce((sum, m) => sum + (m.activeTasksCount || 0), 0);
  const totalAllocatedHours = teamMembers.reduce((sum, m) => sum + (m.totalEstimatedHours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink-primary tracking-tight">Team Workload & Capacity</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-ink-secondary border border-line">
              {teamMembers.length} Members Active
            </span>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            Monitor engineering bandwidth, task distribution equity, and delivery velocity across contributors.
          </p>
        </div>

        <Button
          variant="primary"
          icon={UserPlus}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Contributor
        </Button>
      </div>

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-line flex items-center justify-center text-ink-primary">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-ink-muted">Total Collaborators</span>
            <h4 className="text-lg font-bold text-ink-primary">{teamMembers.length} Engineers</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-ink-muted">Tasks in Flight</span>
            <h4 className="text-lg font-bold text-ink-primary">{totalActiveTasks} Active Tasks</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-ink-muted">Committed Bandwidth</span>
            <h4 className="text-lg font-bold text-ink-primary">{totalAllocatedHours} Allocated Hours</h4>
          </div>
        </Card>
      </div>

      {/* Filter / Search */}
      <div className="bg-white border border-line rounded-xl p-3 shadow-ambient flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary placeholder-ink-muted focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Members Workload Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-canvas-subtle text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Projects</th>
                <th className="py-3 px-4">Active Tasks</th>
                <th className="py-3 px-4">Completed</th>
                <th className="py-3 px-4">Effort (Est / Act)</th>
                <th className="py-3 px-4">Bandwidth Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredMembers.map((member) => (
                <tr key={member._id} className="hover:bg-canvas-subtle/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 border border-line flex items-center justify-center font-bold text-xs text-ink-primary shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-ink-primary block">{member.name}</span>
                        <span className="text-[11px] text-ink-muted">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-line text-ink-primary">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-ink-primary">
                    {member.assignedProjectsCount || 0}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-amber-600">
                    {member.activeTasksCount || 0}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-600">
                    {member.completedTasksCount || 0}
                  </td>
                  <td className="py-3.5 px-4 text-ink-secondary">
                    <span>{member.totalEstimatedHours || 0}h / {member.totalActualHours || 0}h</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        member.status === 'High Load'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : member.status === 'Optimal Load'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {member.status || 'Balanced'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Add Contributor */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Contributor"
        description="Invite a team member to collaborate across projects and tasks."
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jordan Lee"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="jordan@planpulse.io"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Platform Role
            </label>
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
            >
              <option value="member">Member (Engineering)</option>
              <option value="student">Student (Academic)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamWorkload;
