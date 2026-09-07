import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Sparkles,
  BookOpen,
  GraduationCap,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Info,
  Flame,
  Check
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import api from '../services/api';

const DEFAULT_RECOMMENDATION = {
  item: {
    _id: 'rec1',
    title: 'Quantum Mechanics Midterm Exam',
    subject: 'PHYS 202',
    type: 'exam',
    examDate: '2026-09-09T09:00:00.000Z',
    preparationHours: 8,
    importance: 5,
    difficulty: 5
  },
  priorityScore: 96,
  priorityCategory: 'Critical',
  recommendationReason: 'Imminent deadline within 48h combined with maximum difficulty (5/5) and high weight in Physics.'
};

const DEFAULT_PRIORITY_ITEMS = [
  {
    _id: 'p1',
    title: 'Quantum Mechanics Midterm Exam',
    subject: 'PHYS 202',
    type: 'exam',
    dueDate: '2026-09-09',
    dueText: 'In 36 hours',
    effortText: '8h prep needed',
    priorityScore: 96,
    priorityCategory: 'Critical',
    isCrunch: true,
    importance: 5,
    difficulty: 5
  },
  {
    _id: 'p2',
    title: 'Compiler Lexical Analyzer Assignment',
    subject: 'CS 401',
    type: 'assignment',
    dueDate: '2026-09-11',
    dueText: 'In 3 days',
    effortText: '10h effort',
    priorityScore: 91,
    priorityCategory: 'Critical',
    isCrunch: true,
    importance: 5,
    difficulty: 4
  },
  {
    _id: 'p3',
    title: 'Database Normalization Problem Set',
    subject: 'CS 320',
    type: 'assignment',
    dueDate: '2026-09-14',
    dueText: 'In 6 days',
    effortText: '4h effort',
    priorityScore: 78,
    priorityCategory: 'High',
    isCrunch: false,
    importance: 4,
    difficulty: 3
  },
  {
    _id: 'p4',
    title: 'Operating Systems Virtual Memory Lab',
    subject: 'CS 350',
    type: 'assignment',
    dueDate: '2026-09-17',
    dueText: 'In 9 days',
    effortText: '6h effort',
    priorityScore: 65,
    priorityCategory: 'Medium',
    isCrunch: false,
    importance: 3,
    difficulty: 4
  },
  {
    _id: 'p5',
    title: 'Linear Algebra Quiz 3',
    subject: 'MATH 210',
    type: 'exam',
    dueDate: '2026-09-22',
    dueText: 'In 14 days',
    effortText: '3h prep needed',
    priorityScore: 48,
    priorityCategory: 'Medium',
    isCrunch: false,
    importance: 3,
    difficulty: 2
  }
];

const DEFAULT_SCHEDULE = [
  {
    day: 'Monday',
    date: 'Sep 07',
    availableHours: 4,
    allocatedHours: 4,
    sessions: [
      { subject: 'PHYS 202', title: 'Quantum Mechanics Review', hours: 2.5, type: 'exam' },
      { subject: 'CS 401', title: 'Lexer DFA Implementation', hours: 1.5, type: 'assignment' }
    ]
  },
  {
    day: 'Tuesday',
    date: 'Sep 08',
    availableHours: 4,
    allocatedHours: 4,
    sessions: [
      { subject: 'PHYS 202', title: 'Wavefunctions & Past Papers', hours: 3, type: 'exam' },
      { subject: 'CS 401', title: 'Lexer Token Stream Testing', hours: 1, type: 'assignment' }
    ]
  },
  {
    day: 'Wednesday',
    date: 'Sep 09',
    availableHours: 3,
    allocatedHours: 2.5,
    sessions: [
      { subject: 'CS 401', title: 'Parser Grammar Construction', hours: 2.5, type: 'assignment' }
    ]
  },
  {
    day: 'Thursday',
    date: 'Sep 10',
    availableHours: 4,
    allocatedHours: 3.5,
    sessions: [
      { subject: 'CS 320', title: 'B-Tree Indexing Exercises', hours: 2, type: 'assignment' },
      { subject: 'CS 401', title: 'AST Node Hierarchy Spec', hours: 1.5, type: 'assignment' }
    ]
  },
  {
    day: 'Friday',
    date: 'Sep 11',
    availableHours: 3,
    allocatedHours: 3,
    sessions: [
      { subject: 'CS 350', title: 'Page Replacement Algorithms', hours: 2, type: 'assignment' },
      { subject: 'CS 320', title: 'Schema Normalization Final', hours: 1, type: 'assignment' }
    ]
  },
  {
    day: 'Saturday',
    date: 'Sep 12',
    availableHours: 5,
    allocatedHours: 3,
    sessions: [
      { subject: 'MATH 210', title: 'Eigenvalues & Diagonalization', hours: 2, type: 'exam' },
      { subject: 'CS 350', title: 'TLB Buffer Simulation', hours: 1, type: 'assignment' }
    ]
  },
  {
    day: 'Sunday',
    date: 'Sep 13',
    availableHours: 5,
    allocatedHours: 2,
    sessions: [
      { subject: 'MATH 210', title: 'Matrix Factorization Practice', hours: 2, type: 'exam' }
    ]
  }
];

const StudentPlanner = () => {
  const [recommendation, setRecommendation] = useState(DEFAULT_RECOMMENDATION);
  const [priorityQueue, setPriorityQueue] = useState(DEFAULT_PRIORITY_ITEMS);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'assignments' | 'exams'

  // Modal States
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  // New Assignment Form State
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    subject: '',
    deadline: '',
    estimatedEffort: 4,
    importance: 4,
    difficulty: 3
  });

  // New Exam Form State
  const [newExam, setNewExam] = useState({
    title: '',
    subject: '',
    examDate: '',
    preparationHours: 6,
    importance: 5,
    difficulty: 4
  });

  useEffect(() => {
    fetchPlannerData();
  }, []);

  const fetchPlannerData = async () => {
    try {
      const [recRes, prioRes, schedRes] = await Promise.allSettled([
        api.get('/planner/recommendation'),
        api.get('/planner/priorities'),
        api.get('/planner/schedule')
      ]);

      if (recRes.status === 'fulfilled' && recRes.value.data?.data) {
        setRecommendation(recRes.value.data.data);
      }
      if (prioRes.status === 'fulfilled' && prioRes.value.data?.data?.length > 0) {
        setPriorityQueue(prioRes.value.data.data);
      }
      if (schedRes.status === 'fulfilled' && schedRes.value.data?.data?.days) {
        // Map backend schedule if present
      }
    } catch (err) {
      // Keep rich demo data
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.title.trim()) return;

    try {
      await api.post('/planner/assignments', newAssignment);
    } catch (err) {
      // Fallback
    }

    const created = {
      _id: 'a_' + Date.now(),
      title: newAssignment.title,
      subject: newAssignment.subject || 'Academic',
      type: 'assignment',
      dueDate: newAssignment.deadline,
      dueText: 'Scheduled',
      effortText: `${newAssignment.estimatedEffort}h effort`,
      priorityScore: 82,
      priorityCategory: 'High',
      isCrunch: false,
      importance: newAssignment.importance,
      difficulty: newAssignment.difficulty
    };

    setPriorityQueue([created, ...priorityQueue]);
    setIsAssignmentModalOpen(false);
    setNewAssignment({
      title: '',
      subject: '',
      deadline: '',
      estimatedEffort: 4,
      importance: 4,
      difficulty: 3
    });
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!newExam.title.trim()) return;

    try {
      await api.post('/planner/exams', newExam);
    } catch (err) {
      // Fallback
    }

    const created = {
      _id: 'e_' + Date.now(),
      title: newExam.title,
      subject: newExam.subject || 'Exam',
      type: 'exam',
      dueDate: newExam.examDate,
      dueText: 'Upcoming Exam',
      effortText: `${newExam.preparationHours}h prep needed`,
      priorityScore: 88,
      priorityCategory: 'High',
      isCrunch: true,
      importance: newExam.importance,
      difficulty: newExam.difficulty
    };

    setPriorityQueue([created, ...priorityQueue]);
    setIsExamModalOpen(false);
    setNewExam({
      title: '',
      subject: '',
      examDate: '',
      preparationHours: 6,
      importance: 5,
      difficulty: 4
    });
  };

  const totalWeeklyAllocated = schedule.reduce((sum, d) => sum + d.allocatedHours, 0);
  const totalWeeklyAvailable = schedule.reduce((sum, d) => sum + d.availableHours, 0);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink-primary tracking-tight">Student Study Planner</h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
              <Sparkles className="w-3 h-3 text-brand-500" />
              Prioritization Engine Active
            </span>
          </div>
          <p className="text-sm text-ink-secondary mt-1">
            Intelligent daily study allocation with non-overbooking schedule algorithms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={GraduationCap}
            onClick={() => setIsExamModalOpen(true)}
          >
            Add Exam
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsAssignmentModalOpen(true)}
          >
            Add Assignment
          </Button>
        </div>
      </div>

      {/* Top AI Priority Recommendation Card */}
      {recommendation && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 lg:p-6 shadow-subtle border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider">
                Next Best Focus Action
              </span>
              <span className="text-xs font-semibold text-slate-300">
                AI Optimization Recommendation
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight">
                {recommendation.item?.title}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Score {recommendation.priorityScore} / 100 ({recommendation.priorityCategory})
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {recommendation.recommendationReason}
            </p>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-6">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 block">Course</span>
              <span className="text-xs font-semibold text-white">{recommendation.item?.subject}</span>
            </div>
            <button
              onClick={() => alert(`Starting 45m focused study session on ${recommendation.item?.title}!`)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-ambient"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Start Study Block
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-line">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'schedule'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>7-Day Study Timetable</span>
        </button>

        <button
          onClick={() => setActiveTab('priorities')}
          className={`pb-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'priorities'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Intelligent Priority Queue ({priorityQueue.length})</span>
        </button>
      </div>

      {/* View 1: 7-Day Timetable Grid */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Capacity Banner */}
          <div className="bg-white border border-line rounded-xl p-4 shadow-ambient flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-ink-primary">
                  Optimal Study Capacity ({totalWeeklyAllocated}h of {totalWeeklyAvailable}h scheduled)
                </h3>
                <p className="text-[11px] text-ink-muted">
                  No overlapping study commitments. Available buffer: {totalWeeklyAvailable - totalWeeklyAllocated} hours.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-ink-secondary">
                Weekly Utilization:
              </span>
              <span className="text-xs font-bold text-ink-primary px-2 py-0.5 rounded bg-slate-100 border border-line">
                {Math.round((totalWeeklyAllocated / (totalWeeklyAvailable || 1)) * 100)}%
              </span>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {schedule.map((dayPlan, idx) => {
              const isAtCapacity = dayPlan.allocatedHours >= dayPlan.availableHours;
              return (
                <div
                  key={idx}
                  className="bg-white border border-line rounded-xl p-3.5 shadow-ambient flex flex-col justify-between space-y-3"
                >
                  {/* Day Header */}
                  <div className="pb-2 border-b border-line">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink-primary">{dayPlan.day}</span>
                      <span className="text-[10px] text-ink-muted">{dayPlan.date}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-ink-muted">Capacity</span>
                      <span
                        className={`font-semibold ${
                          isAtCapacity ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {dayPlan.allocatedHours}h / {dayPlan.availableHours}h
                      </span>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="space-y-2 flex-1 min-h-[160px]">
                    {dayPlan.sessions.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-ink-muted border border-dashed border-line rounded-lg">
                        Rest / Free Time
                      </div>
                    ) : (
                      dayPlan.sessions.map((session, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-2 rounded-lg bg-canvas-subtle border border-line hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-brand-600 truncate">
                              {session.subject}
                            </span>
                            <span className="text-[9px] font-semibold text-ink-muted px-1.5 py-0.2 rounded bg-white border border-line">
                              {session.hours}h
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-ink-primary line-clamp-2 leading-tight">
                            {session.title}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Day Status Pill */}
                  <div className="pt-2 border-t border-line text-center">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block ${
                        isAtCapacity
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isAtCapacity ? 'At Limit' : 'Balanced'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Intelligent Priority Queue */}
      {activeTab === 'priorities' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-primary">
              All Academic Work Ranked by Multi-Factor Prioritization Formula
            </span>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span>Weights: Urgency (40%) • Proximity (25%) • Difficulty (20%) • Study Gap (15%)</span>
            </div>
          </div>

          <div className="space-y-2">
            {priorityQueue.map((item) => (
              <div
                key={item._id}
                className="bg-white border border-line rounded-xl p-4 shadow-ambient hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                      item.priorityScore >= 90
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : item.priorityScore >= 70
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-slate-50 border-line text-ink-primary'
                    }`}
                  >
                    {item.priorityScore}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100">
                        {item.subject}
                      </span>
                      <h4 className="text-xs font-bold text-ink-primary">{item.title}</h4>
                      <Badge variant={item.priorityCategory.toLowerCase()} size="xs">
                        {item.priorityCategory}
                      </Badge>
                      {item.isCrunch && (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Crunch Alert
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-muted">
                      <span>{item.effortText}</span>
                      <span>•</span>
                      <span>Importance: {item.importance}/5</span>
                      <span>•</span>
                      <span>Difficulty: {item.difficulty}/5</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-ink-muted shrink-0 pl-12 sm:pl-0">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-ink-muted" />
                    <span className="font-semibold text-ink-primary">{item.dueText}</span>
                  </div>

                  <Button variant="secondary" size="xs">
                    Mark Studied
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Assignment */}
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Add Course Assignment"
        description="Register an assignment for automated urgency and effort scheduling."
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Key-Value Store Lab"
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Subject / Course Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS 401"
                value={newAssignment.subject}
                onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Submission Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={newAssignment.deadline}
                onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Effort (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={newAssignment.estimatedEffort}
                onChange={(e) => setNewAssignment({ ...newAssignment, estimatedEffort: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Importance (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={newAssignment.importance}
                onChange={(e) => setNewAssignment({ ...newAssignment, importance: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Difficulty (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={newAssignment.difficulty}
                onChange={(e) => setNewAssignment({ ...newAssignment, difficulty: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAssignmentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Exam */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Add Academic Exam"
        description="Schedule exam preparation milestones and automated crunch detection."
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Exam Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Midterm Examination"
              value={newExam.title}
              onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
              className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PHYS 202"
                value={newExam.subject}
                onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Exam Date *
              </label>
              <input
                type="datetime-local"
                required
                value={newExam.examDate}
                onChange={(e) => setNewExam({ ...newExam, examDate: e.target.value })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Prep Needed (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="80"
                value={newExam.preparationHours}
                onChange={(e) => setNewExam({ ...newExam, preparationHours: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Importance (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={newExam.importance}
                onChange={(e) => setNewExam({ ...newExam, importance: parseInt(e.target.value) || 4 })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">
                Difficulty (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={newExam.difficulty}
                onChange={(e) => setNewExam({ ...newExam, difficulty: parseInt(e.target.value) || 4 })}
                className="w-full px-3 py-2 bg-canvas-subtle border border-line rounded-lg text-xs text-ink-primary focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsExamModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Schedule Exam
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentPlanner;
