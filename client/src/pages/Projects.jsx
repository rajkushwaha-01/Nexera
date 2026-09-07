import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ListFilter,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Users,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import api from '../services/api';

const DEFAULT_PROJECTS = [
  {
    _id: 'p1',
    title: 'Integrated Project-Monitoring Platform',
    description: 'Centralized observability, milestone tracking, and task delegation platform for engineering teams.',
    status: 'Active',
    priority: 'High',
    progress: 78,
    startDate: '2026-08-15',
    deadline: '2026-09-20',
    members: [
      { name: 'Dr. Sarah Lead', role: 'admin' },
      { name: 'Kevin Dev', role: 'member' },
      { name: 'Maya Chen', role: 'member' }
    ],
    taskCount: 14,
    completedTaskCount: 11
  },
  {
    _id: 'p2',
    title: 'Compiler Lexical Analyzer & Parser',
    description: 'LL(1) syntax tree generator with symbol table validation and error recovery routines.',
    status: 'At Risk',
    priority: 'Urgent',
    progress: 42,
    startDate: '2026-08-28',
    deadline: '2026-09-12',
    members: [
      { name: 'Alex Student', role: 'student' },
      { name: 'Liam Smith', role: 'student' }
    ],
    taskCount: 8,
    completedTaskCount: 3
  },
  {
    _id: 'p3',
    title: 'Quantum Key Distribution Simulation',
    description: 'BB84 protocol model simulating photon polarization states and eavesdropping detection rates.',
    status: 'Planning',
    priority: 'Medium',
    progress: 15,
    startDate: '2026-09-01',
    deadline: '2026-10-15',
    members: [
      { name: 'Elena Rostova', role: 'member' }
    ],
    taskCount: 6,
    completedTaskCount: 1
  },
  {
    _id: 'p4',
    title: 'Autonomous Drone Flight Telemetry',
    description: 'Real-time WebSocket telemetry ingest and PID altitude stabilization algorithms.',
    status: 'Active',
    priority: 'High',
    progress: 64,
    startDate: '2026-08-10',
    deadline: '2026-09-30',
    members: [
      { name: 'David Miller', role: 'member' },
      { name: 'Samira Patel', role: 'member' }
    ],
    taskCount: 12,
    completedTaskCount: 8
  },
  {
    _id: 'p5',
    title: 'Distributed Key-Value Store Engine',
    description: 'Raft consensus implementation with write-ahead logs and leader election heartbeats.',
    status: 'Completed',
    priority: 'Medium',
    progress: 100,
    startDate: '2026-07-01',
    deadline: '2026-08-30',
    members: [
      { name: 'Kevin Dev', role: 'member' },
      { name: 'Dr. Sarah Lead', role: 'admin' }
    ],
    taskCount: 18,
    completedTaskCount: 18
  },
  {
    _id: 'p6',
    title: 'Edge AI Vision Sensor Pipeline',
    description: 'TensorFlow Lite model quantization for low-power microcontroller inference.',
    status: 'On Hold',
    priority: 'Low',
    progress: 25,
    startDate: '2026-08-01',
    deadline: '2026-11-01',
    members: [
      { name: 'Maya Chen', role: 'member' }
    ],
    taskCount: 5,
    completedTaskCount: 1
  }
];

const KANBAN_COLUMNS = [
  { id: 'Planning', label: 'Planning', color: 'border-slate-300' },
  { id: 'Active', label: 'Active', color: 'border-sky-300' },
  { id: 'At Risk', label: 'At Risk', color: 'border-amber-300' },
  { id: 'Completed', label: 'Completed', color: 'border-emerald-300' },
  { id: 'On Hold', label: 'On Hold', color: 'border-slate-200' }
];

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for New Project
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    status: 'Planning',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    deadline: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data?.data && res.data.data.length > 0) {
        setProjects(res.data.data);
      }
    } catch (err) {
      // Keep rich default projects
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/projects', newProject);
      if (res.data?.data) {
        setProjects([res.data.data, ...projects]);
      } else {
        const createdMock = {
          ...newProject,
          _id: 'p_' + Date.now(),
          progress: 0,
          members: [{ name: 'You (Owner)', role: 'admin' }],
          taskCount: 0,
          completedTaskCount: 0
        };
        setProjects([createdMock, ...projects]);
      }
      setIsCreateModalOpen(false);
      setNewProject({
        title: '',
        description: '',
        status: 'Planning',
        priority: 'Medium',
        startDate: new Date().toISOString().split('T')[0],
        deadline: ''
      });
    } catch (err) {
      const createdMock = {
        ...newProject,
        _id: 'p_' + Date.now(),
        progress: 0,
        members: [{ name: 'You (Owner)', role: 'admin' }],
        taskCount: 0,
        completedTaskCount: 0
      };
      setProjects([createdMock, ...projects]);
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink-primary tracking-tight">Projects Workspace</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-ink-secondary border border-line">
              {filteredProjects.length} total
            </span>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            Monitor engineering milestones, team velocity, and project risk indicators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-line rounded-lg p-0.5 shadow-ambient">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-slate-100 text-ink-primary font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-100 text-ink-primary font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
              title="Table View"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-line rounded-xl p-3 shadow-ambient flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, milestones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary placeholder-ink-muted focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 text-xs text-ink-muted shrink-0">
            <ListFilter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-canvas-subtle border border-line rounded-lg px-2.5 py-1.5 text-ink-primary focus:outline-none focus:border-brand-500"
          >
            <option value="All">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="At Risk">At Risk</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-ink-muted shrink-0 ml-2">
            <span>Priority:</span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-canvas-subtle border border-line rounded-lg px-2.5 py-1.5 text-ink-primary focus:outline-none focus:border-brand-500"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-6">
          {KANBAN_COLUMNS.map((column) => {
            const columnProjects = filteredProjects.filter((p) => p.status === column.id);
            return (
              <div
                key={column.id}
                className="bg-canvas-subtle border border-line rounded-xl p-3 flex flex-col gap-3 min-w-[260px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-ink-primary uppercase tracking-wider">
                      {column.label}
                    </span>
                    <span className="text-[11px] font-bold text-ink-muted bg-white border border-line px-1.5 py-0.2 rounded-md">
                      {columnProjects.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setNewProject({ ...newProject, status: column.id });
                      setIsCreateModalOpen(true);
                    }}
                    className="p-1 hover:bg-white rounded-md text-ink-muted hover:text-ink-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 min-h-[300px]">
                  {columnProjects.length === 0 ? (
                    <div className="h-28 border border-dashed border-line rounded-lg flex items-center justify-center text-xs text-ink-muted">
                      No projects
                    </div>
                  ) : (
                    columnProjects.map((project) => (
                      <ProjectCard
                        key={project._id}
                        project={project}
                        onClick={() => navigate(`/projects/${project._id}`)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-canvas-subtle text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredProjects.map((project) => (
                  <tr
                    key={project._id}
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className="hover:bg-canvas-subtle/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-ink-primary">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-ink-muted group-hover:text-brand-500 transition-colors shrink-0" />
                        <div>
                          <div className="font-semibold text-ink-primary group-hover:text-brand-600 transition-colors">
                            {project.title}
                          </div>
                          <div className="text-[11px] text-ink-muted line-clamp-1 max-w-xs font-normal">
                            {project.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={project.status.toLowerCase().replace(' ', '')}>
                        {project.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={project.priority.toLowerCase()}>
                        {project.priority}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              project.status === 'Completed'
                                ? 'bg-emerald-500'
                                : project.status === 'At Risk'
                                ? 'bg-amber-500'
                                : 'bg-brand-500'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-ink-muted">
                          {project.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-ink-secondary">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                        <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No date'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {(project.members || []).slice(0, 3).map((m, idx) => (
                          <div
                            key={idx}
                            className="inline-block h-6 w-6 rounded-full ring-1 ring-white bg-slate-200 text-center font-bold text-[10px] leading-6 text-ink-primary shrink-0"
                            title={m.name || 'Member'}
                          >
                            {(m.name || 'M').charAt(0)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/projects/${project._id}`}
                        className="inline-flex items-center text-xs font-medium text-brand-500 hover:text-brand-600 gap-1 group-hover:translate-x-0.5 transition-all"
                      >
                        Details <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Create New Project */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project"
        description="Define milestone boundaries, prioritization, and delivery schedules."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Consensus Engine"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="High-level engineering scope, deliverables, and architecture..."
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Status
              </label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="At Risk">At Risk</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Priority
              </label>
              <select
                value={newProject.priority}
                onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={newProject.startDate}
                onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={newProject.deadline}
                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Reusable Minimalist Project Card for Kanban
const ProjectCard = ({ project, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-line rounded-xl p-4 shadow-ambient hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-xs text-ink-primary group-hover:text-brand-500 transition-colors line-clamp-1">
          {project.title}
        </h3>
        <Badge variant={project.priority.toLowerCase()} size="xs">
          {project.priority}
        </Badge>
      </div>

      <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed mb-3 font-normal">
        {project.description || 'No description provided.'}
      </p>

      {/* Progress Bar */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between text-[10px] text-ink-muted">
          <span>Progress</span>
          <span className="font-semibold text-ink-primary">{project.progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              project.status === 'Completed'
                ? 'bg-emerald-500'
                : project.status === 'At Risk'
                ? 'bg-amber-500'
                : 'bg-brand-500'
            }`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Card Footer: Deadline & Team Avatars */}
      <div className="flex items-center justify-between pt-2 border-t border-line text-[11px] text-ink-muted">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-ink-muted" />
          <span>
            {project.deadline
              ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : 'No deadline'}
          </span>
        </div>

        <div className="flex -space-x-1 overflow-hidden">
          {(project.members || []).slice(0, 3).map((m, idx) => (
            <div
              key={idx}
              className="inline-block h-5 w-5 rounded-full ring-1 ring-white bg-slate-200 text-center font-bold text-[9px] leading-5 text-ink-primary"
              title={m.name || 'Member'}
            >
              {(m.name || 'M').charAt(0)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
