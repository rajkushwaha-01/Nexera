import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  Check,
  Calendar,
  ChevronRight
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [prioritiesData, setPrioritiesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock initial demo data matching Stitch screen design if backend is loading
  const defaultMetrics = {
    projects: { active: 4, completed: 2, atRisk: 1, overallProgress: 78 },
    tasks: { total: 36, completed: 28, pending: 8, overdue: 1 },
  };

  const defaultFocusSprint = [
    { id: 1, title: 'Refactor REST API Authentication', done: true, tag: 'Architecture' },
    { id: 2, title: 'Define Prioritization Formula Weights', done: true, tag: 'Engine' },
    { id: 3, title: 'Implement Non-overbooking Study Schedule', done: false, tag: 'Algorithm' },
    { id: 4, title: 'Deploy Minimalist SaaS UI Shell', done: false, tag: 'Frontend' },
  ];

  const defaultPriorityQueue = [
    {
      id: 1,
      title: 'Quantum Mechanics Quiz',
      subject: 'Physics 202',
      type: 'exam',
      priorityCategory: 'Critical',
      priorityScore: 96,
      dueText: 'Due in 20h',
      effort: '6h prep',
    },
    {
      id: 2,
      title: 'Term Paper on Distributed Consensus',
      subject: 'CS 401',
      type: 'assignment',
      priorityCategory: 'Critical',
      priorityScore: 92,
      dueText: 'Overdue (Yesterday)',
      effort: '3h effort',
      isOverdue: true,
    },
    {
      id: 3,
      title: 'Kernel Device Driver Module',
      subject: 'Operating Systems',
      type: 'assignment',
      priorityCategory: 'High',
      priorityScore: 84,
      dueText: 'Due in 2 days',
      effort: '14h prep (Crunch)',
    },
    {
      id: 4,
      title: 'Graph Traversal Implementation',
      subject: 'Algorithms',
      type: 'assignment',
      priorityCategory: 'Medium',
      priorityScore: 68,
      dueText: 'Due in 5 days',
      effort: '4h effort',
    },
  ];

  const defaultDeadlines = [
    { title: 'Term Paper on Distributed Consensus', date: 'Yesterday', isOverdue: true, tag: 'CS 401' },
    { title: 'Quantum Mechanics Quiz', date: 'Tomorrow, 09:00 AM', isUrgent: true, tag: 'Physics 202' },
    { title: 'Kernel Device Driver Module', date: 'Wednesday, 11:59 PM', tag: 'Operating Systems' },
    { title: 'Compiler Symbol Table Spec', date: 'Friday, 05:00 PM', tag: 'Compilers' },
  ];

  const defaultActivity = [
    { author: 'Dr. Sarah Lead', action: 'posted status update to', target: 'Project-Monitoring Platform', time: '20m ago', text: 'Telemetry pipeline merged to main.' },
    { author: 'Kevin Dev', action: 'completed task', target: 'Design Database Schemas', time: '2h ago' },
    { author: 'Maya Designer', action: 'uploaded design tokens for', target: 'Clean White SaaS Aesthetic', time: '4h ago' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, prioRes] = await Promise.allSettled([
          api.get('/dashboard/summary'),
          api.get('/planner/priorities'),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.data?.success) {
          setDashboardData(dashRes.value.data.data);
        }
        if (prioRes.status === 'fulfilled' && prioRes.value.data?.success) {
          setPrioritiesData(prioRes.value.data.data);
        }
      } catch (err) {
        console.warn('Dashboard fetch fallback to Stitch mock:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const metrics = dashboardData?.metrics || defaultMetrics;
  const priorityItems = prioritiesData?.items || defaultPriorityQueue;
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || defaultDeadlines;
  const recentUpdates = dashboardData?.recentUpdates || defaultActivity;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Welcome back, {user?.name || 'Scholar'}. Here is your project telemetry & study queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/projects">
            <Button variant="secondary" size="sm" icon={FolderKanban}>
              View Projects
            </Button>
          </Link>
          <Link to="/planner">
            <Button variant="primary" size="sm" icon={Sparkles}>
              Study Planner
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Top Metric Cards matching Stitch design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-muted">Active Projects</span>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-line">
              <FolderKanban className="w-3.5 h-3.5 text-ink-primary" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink-primary">{metrics.projects?.active || 4}</span>
            <span className="text-[11px] font-medium text-emerald-600">+1 this week</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-ink-primary h-full rounded-full" style={{ width: '75%' }} />
          </div>
        </Card>

        {/* Completed Tasks */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-muted">Tasks Completed</span>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-line">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink-primary">{metrics.tasks?.completed || 28}</span>
            <span className="text-[11px] text-ink-muted">of {metrics.tasks?.total || 36} tasks</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78%' }} />
          </div>
        </Card>

        {/* Urgent Deadlines */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-muted">Urgent Items</span>
            <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{metrics.tasks?.overdue ? metrics.tasks.overdue + 2 : 3}</span>
            <span className="text-[11px] font-medium text-rose-600">Requires focus</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: '60%' }} />
          </div>
        </Card>

        {/* Average Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-muted">Overall Progress</span>
            <div className="p-1.5 rounded-lg bg-slate-50 border border-line">
              <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink-primary">{metrics.projects?.overallProgress || 78}%</span>
            <span className="text-[11px] text-emerald-600">On Track</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-brand-500 h-full rounded-full" style={{ width: `${metrics.projects?.overallProgress || 78}%` }} />
          </div>
        </Card>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Focus Sprint & Intelligent Priority Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Focus Sprint Card */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-ink-primary">Current Focus Sprint</h2>
                <p className="text-xs text-ink-muted">Sprint 4: Core Engine and Design System Integration</p>
              </div>
              <Badge variant="active" size="sm" dot>Active Sprint</Badge>
            </div>

            <div className="space-y-2 mt-4">
              {defaultFocusSprint.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-line hover:bg-canvas-subtle transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        item.done ? 'bg-ink-primary border-ink-primary text-white' : 'border-line bg-white'
                      }`}
                    >
                      {item.done && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-xs ${item.done ? 'line-through text-ink-faint' : 'font-medium text-ink-primary'}`}>
                      {item.title}
                    </span>
                  </div>
                  <Badge variant="default" size="sm">{item.tag}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Intelligent Priority Queue Card */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-bold text-ink-primary">Intelligent Priority Queue</h2>
              </div>
              <Link to="/planner" className="text-xs text-brand-600 hover:underline flex items-center gap-1 font-medium">
                View all ranked items <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {priorityItems.slice(0, 4).map((item, idx) => (
                <div
                  key={item._id || item.id || idx}
                  className="p-3.5 rounded-xl border border-line bg-white hover:border-line-strong transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.priorityCategory === 'Critical'
                            ? 'critical'
                            : item.priorityCategory === 'High'
                            ? 'high'
                            : 'medium'
                        }
                        size="sm"
                        dot
                      >
                        {item.priorityCategory || 'High'} ({item.priorityScore || 85})
                      </Badge>
                      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                        {item.subject || 'Academic'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-ink-primary truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {item.reason || `${item.dueText || 'Due soon'} • ${item.effort || 'Focused effort'}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link to="/planner">
                      <Button variant="secondary" size="sm">
                        Schedule
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Upcoming Deadlines & Recent Activity Feed */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-ink-primary">Upcoming Deadlines</h2>
              <span className="text-[11px] text-ink-muted">Next 7 Days</span>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.slice(0, 4).map((d, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-canvas-subtle transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${d.isOverdue ? 'bg-rose-500 ring-2 ring-rose-200' : d.isUrgent ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink-primary truncate">{d.title}</p>
                    <div className="flex items-center justify-between text-[11px] text-ink-muted mt-0.5">
                      <span>{d.date || (d.dueDate ? new Date(d.dueDate).toLocaleDateString() : 'Upcoming')}</span>
                      <span className={`font-medium ${d.isOverdue ? 'text-rose-600' : ''}`}>
                        {d.isOverdue ? 'Overdue' : (d.tag || d.projectTitle || 'Assignment')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-ink-primary">Recent Activity Feed</h2>
              <Link to="/projects" className="text-[11px] text-brand-600 hover:underline">
                Projects
              </Link>
            </div>

            <div className="space-y-3">
              {recentUpdates.slice(0, 4).map((act, idx) => (
                <div key={idx} className="text-xs pb-3 border-b border-line last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-ink-primary shrink-0">
                      {act.author?.name ? act.author.name.charAt(0) : (typeof act.author === 'string' ? act.author.charAt(0) : 'U')}
                    </div>
                    <p className="text-ink-secondary truncate">
                      <strong className="text-ink-primary">{act.author?.name || act.author}</strong> {act.action || 'posted update'}
                    </p>
                  </div>
                  {act.text && (
                    <p className="text-[11px] text-ink-muted mt-1.5 pl-8 italic">
                      "{act.text}"
                    </p>
                  )}
                  <span className="block text-[10px] text-ink-faint pl-8 mt-1">
                    {act.time || (act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent')}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
