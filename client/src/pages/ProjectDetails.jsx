import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Users,
  MessageSquare,
  Sparkles,
  ChevronRight,
  MoreVertical,
  Check,
  Send,
  Milestone,
  FileText
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import api from '../services/api';

const DEFAULT_PROJECT_DETAIL = {
  _id: 'p1',
  title: 'Integrated Project-Monitoring Platform',
  description: 'Enterprise grade project monitoring platform combining task delegation, status telemetry, deadline tracking, and intelligent academic prioritization scheduling.',
  status: 'Active',
  priority: 'High',
  progress: 78,
  startDate: '2026-08-15',
  deadline: '2026-09-20',
  owner: { name: 'Dr. Sarah Lead', email: 'sarah@planpulse.io', role: 'admin' },
  members: [
    { _id: 'm1', name: 'Dr. Sarah Lead', email: 'sarah@planpulse.io', role: 'admin' },
    { _id: 'm2', name: 'Kevin Dev', email: 'kevin@planpulse.io', role: 'member' },
    { _id: 'm3', name: 'Maya Chen', email: 'maya@planpulse.io', role: 'member' },
    { _id: 'm4', name: 'Alex Student', email: 'alex@planpulse.io', role: 'student' }
  ]
};

const DEFAULT_TASKS = [
  {
    _id: 't1',
    title: 'Setup Express Backend Architecture & JWT Auth',
    description: 'Implement secure login, registration, password hashing with bcrypt, and token verification middleware.',
    status: 'Completed',
    priority: 'Urgent',
    assignedTo: { name: 'Kevin Dev' },
    dueDate: '2026-08-20',
    estimatedEffort: 6,
    actualEffort: 5
  },
  {
    _id: 't2',
    title: 'Design Project & Task Schemas with Cascade Rules',
    description: 'Establish Mongoose schemas for projects, tasks, indexes on status and priority, and automatic progress calculation.',
    status: 'Completed',
    priority: 'High',
    assignedTo: { name: 'Maya Chen' },
    dueDate: '2026-08-26',
    estimatedEffort: 8,
    actualEffort: 7
  },
  {
    _id: 't3',
    title: 'Build Team Member Workload Aggregation API',
    description: 'Pipeline calculating member workload, assigned projects, active tasks, and total estimated effort.',
    status: 'Completed',
    priority: 'Medium',
    assignedTo: { name: 'Dr. Sarah Lead' },
    dueDate: '2026-09-02',
    estimatedEffort: 5,
    actualEffort: 4
  },
  {
    _id: 't4',
    title: 'Implement Multi-Factor Prioritization Engine',
    description: 'Formulate urgency, deadline proximity, importance, and difficulty weighting normalized to 0-100 score.',
    status: 'In Progress',
    priority: 'Urgent',
    assignedTo: { name: 'Alex Student' },
    dueDate: '2026-09-10',
    estimatedEffort: 10,
    actualEffort: 6
  },
  {
    _id: 't5',
    title: 'Generate Minimalist Clean White UI in Stitch MCP',
    description: 'Render responsive desktop and tablet screens using hairline borders and neutral palette.',
    status: 'In Progress',
    priority: 'High',
    assignedTo: { name: 'Maya Chen' },
    dueDate: '2026-09-12',
    estimatedEffort: 8,
    actualEffort: 5
  },
  {
    _id: 't6',
    title: 'Integrate Non-Overbooking Timetable Scheduler',
    description: 'Greedy study slot allocator adhering to user dayOfWeek availability constraints.',
    status: 'Todo',
    priority: 'Medium',
    assignedTo: { name: 'Kevin Dev' },
    dueDate: '2026-09-15',
    estimatedEffort: 7,
    actualEffort: 0
  },
  {
    _id: 't7',
    title: 'End-to-End Test Suite & Verification',
    description: 'Verify 169 unit and integration assertions across auth, projects, tasks, and recommendations.',
    status: 'Todo',
    priority: 'Low',
    assignedTo: { name: 'Alex Student' },
    dueDate: '2026-09-18',
    estimatedEffort: 4,
    actualEffort: 0
  }
];

const DEFAULT_UPDATES = [
  {
    _id: 'u1',
    author: { name: 'Dr. Sarah Lead' },
    status: 'Active',
    progress: 78,
    text: 'Phase 5 Backend hardening complete! All 169 automated backend tests are passing with zero regressions.',
    createdAt: '2026-09-06T14:30:00Z'
  },
  {
    _id: 'u2',
    author: { name: 'Maya Chen' },
    status: 'Active',
    progress: 65,
    text: 'Design tokens established in Stitch MCP with pure white canvas, 1px hairline borders, and Inter typography.',
    createdAt: '2026-09-04T09:15:00Z'
  },
  {
    _id: 'u3',
    author: { name: 'Kevin Dev' },
    status: 'Active',
    progress: 50,
    text: 'Project and Task CRUD APIs fully hooked up with automatic task completion progress percentage calculation.',
    createdAt: '2026-08-30T16:45:00Z'
  }
];

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(DEFAULT_PROJECT_DETAIL);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [updates, setUpdates] = useState(DEFAULT_UPDATES);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'team' | 'updates'

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Form states
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Todo',
    dueDate: '',
    estimatedEffort: 4,
    assignedTo: ''
  });

  const [newUpdate, setNewUpdate] = useState({
    text: '',
    progress: 78,
    status: 'Active'
  });

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      if (id && id !== 'p1') {
        const res = await api.get(`/projects/${id}`);
        if (res.data?.data) {
          setProject(res.data.data);
        }
        const taskRes = await api.get(`/projects/${id}/tasks`);
        if (taskRes.data?.data && taskRes.data.data.length > 0) {
          setTasks(taskRes.data.data);
        }
        const updateRes = await api.get(`/projects/${id}/updates`);
        if (updateRes.data?.data && updateRes.data.data.length > 0) {
          setUpdates(updateRes.data.data);
        }
      }
    } catch (err) {
      // Fallback gracefully to default rich data
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const taskObj = {
      ...newTask,
      _id: 't_' + Date.now(),
      actualEffort: 0,
      assignedTo: { name: newTask.assignedTo || 'Unassigned' }
    };

    try {
      if (id && id !== 'p1') {
        const res = await api.post(`/projects/${id}/tasks`, newTask);
        if (res.data?.data) {
          setTasks([res.data.data, ...tasks]);
        } else {
          setTasks([taskObj, ...tasks]);
        }
      } else {
        setTasks([taskObj, ...tasks]);
      }
    } catch (err) {
      setTasks([taskObj, ...tasks]);
    }

    setIsTaskModalOpen(false);
    setNewTask({
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Todo',
      dueDate: '',
      estimatedEffort: 4,
      assignedTo: ''
    });
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdate.text.trim()) return;

    const updateObj = {
      ...newUpdate,
      _id: 'u_' + Date.now(),
      author: { name: 'You' },
      createdAt: new Date().toISOString()
    };

    try {
      if (id && id !== 'p1') {
        const res = await api.post(`/projects/${id}/updates`, newUpdate);
        if (res.data?.data) {
          setUpdates([res.data.data, ...updates]);
        } else {
          setUpdates([updateObj, ...updates]);
        }
      } else {
        setUpdates([updateObj, ...updates]);
      }
    } catch (err) {
      setUpdates([updateObj, ...updates]);
    }

    // Also update project progress in view
    setProject({ ...project, progress: newUpdate.progress, status: newUpdate.status });
    setIsUpdateModalOpen(false);
    setNewUpdate({ text: '', progress: newUpdate.progress, status: newUpdate.status });
  };

  const handleToggleTaskStatus = (taskId) => {
    setTasks(tasks.map(t => {
      if (t._id === taskId) {
        const nextStatus = t.status === 'Completed' ? 'In Progress' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const totalEffort = tasks.reduce((sum, t) => sum + (t.estimatedEffort || 0), 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <Link to="/projects" className="hover:text-ink-primary flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
        <span>/</span>
        <span className="text-ink-primary font-medium truncate">{project.title}</span>
      </div>

      {/* Project Overview Banner Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-bold text-ink-primary tracking-tight">
                {project.title}
              </h1>
              <Badge variant={project.status.toLowerCase().replace(' ', '')}>
                {project.status}
              </Badge>
              <Badge variant={project.priority.toLowerCase()}>
                {project.priority} Priority
              </Badge>
            </div>
            <p className="text-xs lg:text-sm text-ink-secondary leading-relaxed max-w-3xl">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              icon={MessageSquare}
              onClick={() => setIsUpdateModalOpen(true)}
            >
              Post Update
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Add Task
            </Button>
          </div>
        </div>

        {/* Project Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-line">
          <div>
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider block mb-1">
              Overall Progress
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-ink-primary">{project.progress}%</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider block mb-1">
              Milestone Tasks
            </span>
            <span className="text-sm font-bold text-ink-primary">
              {completedCount} of {tasks.length} Completed
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider block mb-1">
              Target Deadline
            </span>
            <div className="flex items-center gap-1 text-sm font-semibold text-ink-primary">
              <Calendar className="w-3.5 h-3.5 text-ink-muted" />
              <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider block mb-1">
              Team Allocated
            </span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-ink-primary">
              <Users className="w-3.5 h-3.5 text-ink-muted" />
              <span>{(project.members || []).length} Members ({totalEffort}h effort)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-4 border-b border-line">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'tasks'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Milestone className="w-4 h-4" />
          <span>Tasks & Milestones ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'team'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team & Workload ({(project.members || []).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('updates')}
          className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'updates'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Activity Timeline ({updates.length})</span>
        </button>
      </div>

      {/* Tab 1: Tasks & Milestones */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-primary">Project Work Breakdown</span>
            <Button
              variant="secondary"
              size="xs"
              icon={Plus}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Add Task
            </Button>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white border border-line rounded-xl p-4 shadow-ambient hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleTaskStatus(task._id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      task.status === 'Completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-line hover:border-brand-500 bg-white'
                    }`}
                  >
                    {task.status === 'Completed' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs font-semibold ${
                          task.status === 'Completed'
                            ? 'line-through text-ink-muted'
                            : 'text-ink-primary'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <Badge variant={task.priority.toLowerCase()} size="xs">
                        {task.priority}
                      </Badge>
                      <span className="text-[10px] text-ink-muted px-1.5 py-0.5 rounded bg-slate-100 border border-line">
                        {task.status}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-ink-muted mt-1 max-w-2xl leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-ink-muted shrink-0 pl-8 sm:pl-0">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-ink-muted" />
                    <span>{task.estimatedEffort || 0}h est</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-ink-primary">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold text-ink-primary">
                      {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : 'U'}
                    </div>
                    <span className="text-[11px] hidden md:inline">
                      {task.assignedTo?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Team & Workload */}
      {activeTab === 'team' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-primary">Assigned Team Members</h3>
              <p className="text-xs text-ink-secondary">Collaborators contributing to this project roadmap.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(project.members || []).map((member, idx) => {
              const memberTasks = tasks.filter(t => t.assignedTo?.name === member.name);
              const memberEffort = memberTasks.reduce((s, t) => s + (t.estimatedEffort || 0), 0);

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-line bg-canvas-subtle flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 border border-line flex items-center justify-center font-bold text-sm text-ink-primary">
                      {(member.name || 'M').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-ink-primary">{member.name}</h4>
                      <p className="text-[11px] text-ink-muted">{member.email || 'team@planpulse.io'}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100 inline-block mt-1">
                        {member.role || 'Contributor'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-ink-primary block">
                      {memberTasks.length} Tasks
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      {memberEffort}h allocation
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tab 3: Activity Timeline */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-primary">Project Status Timeline</span>
            <Button
              variant="secondary"
              size="xs"
              icon={Send}
              onClick={() => setIsUpdateModalOpen(true)}
            >
              Post Update
            </Button>
          </div>

          <div className="space-y-3">
            {updates.map((update) => (
              <Card key={update._id} className="p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-ink-primary">
                      {update.author?.name ? update.author.name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-ink-primary">
                        {update.author?.name || 'Team Member'}
                      </span>
                      <span className="text-[10px] text-ink-muted block">
                        {new Date(update.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={update.status.toLowerCase().replace(' ', '')} size="xs">
                      {update.status}
                    </Badge>
                    <span className="text-xs font-bold text-ink-primary bg-slate-100 px-2 py-0.5 rounded border border-line">
                      {update.progress}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink-secondary leading-relaxed pl-9">
                  {update.text}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Task */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Project Task"
        description="Create an actionable milestone task and assign effort allocation."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement Token Verification Middleware"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Task acceptance criteria and engineering notes..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Status
              </label>
              <select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newTask.estimatedEffort}
                onChange={(e) => setNewTask({ ...newTask, estimatedEffort: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Assignee
            </label>
            <select
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
            >
              <option value="">Select Member</option>
              {(project.members || []).map((m, idx) => (
                <option key={idx} value={m.name}>
                  {m.name} ({m.role || 'member'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Post Project Update */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Post Status Update"
        description="Broadcast milestone progress and status adjustments to the team."
      >
        <form onSubmit={handlePostUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Update Summary *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detail what was accomplished, blockers resolved, or next steps..."
              value={newUpdate.text}
              onChange={(e) => setNewUpdate({ ...newUpdate, text: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Project Status
              </label>
              <select
                value={newUpdate.status}
                onChange={(e) => setNewUpdate({ ...newUpdate, status: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              >
                <option value="Active">Active</option>
                <option value="At Risk">At Risk</option>
                <option value="Planning">Planning</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Progress Percentage ({newUpdate.progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={newUpdate.progress}
                onChange={(e) => setNewUpdate({ ...newUpdate, progress: parseInt(e.target.value) })}
                className="w-full mt-2 accent-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsUpdateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Post Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetails;
