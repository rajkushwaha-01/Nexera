import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'student') {
      setEmail('student@university.edu');
      setPassword('Password123!');
    } else {
      setEmail('admin@university.edu');
      setPassword('Password123!');
    }
  };

  return (
    <div className="min-h-screen bg-canvas-subtle flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white border border-line rounded-2xl shadow-ambient-lg overflow-hidden">
        {/* Left Form Pane */}
        <div className="p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-ink-primary flex items-center justify-center text-white shadow-ambient">
                <Target className="w-4 h-4 text-brand-100" />
              </div>
              <span className="font-bold text-ink-primary tracking-tight text-lg">PlanPulse</span>
            </div>

            <h1 className="text-2xl font-bold text-ink-primary tracking-tight mb-1.5">
              Welcome back
            </h1>
            <p className="text-xs text-ink-muted leading-relaxed mb-6">
              Sign in to access your projects, tasks, and study schedule.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  className="w-full px-3 py-2 text-xs bg-canvas-subtle border border-line rounded-lg text-ink-primary placeholder:text-ink-faint focus:outline-none focus:bg-white focus:border-line-strong transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-ink-primary">
                    Password
                  </label>
                  <a href="#forgot" className="text-[11px] text-brand-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs bg-canvas-subtle border border-line rounded-lg text-ink-primary placeholder:text-ink-faint focus:outline-none focus:bg-white focus:border-line-strong transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-3.5 h-3.5 rounded border-line text-ink-primary focus:ring-0"
                />
                <label htmlFor="remember" className="text-xs text-ink-secondary">
                  Remember this device for 30 days
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full justify-center"
              >
                {isLoading ? 'Signing in...' : 'Sign in to PlanPulse'}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </form>

            {/* Quick Demo Fill Buttons for Evaluators */}
            <div className="mt-6 pt-4 border-t border-line">
              <span className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-2">
                Hackathon Quick Demo Fill:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('student')}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-canvas-subtle hover:bg-slate-100 border border-line rounded-md text-ink-secondary text-center transition-colors"
                >
                  Student Account
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('admin')}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-canvas-subtle hover:bg-slate-100 border border-line rounded-md text-ink-secondary text-center transition-colors"
                >
                  Lead / Admin
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-muted text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Right Feature Showcase Pane */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-canvas-subtle border-l border-line relative">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intelligent Prioritization</span>
          </div>

          <div className="space-y-6 my-auto py-8">
            <div className="bg-white border border-line rounded-xl p-4 shadow-ambient">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-ink-primary">Algorithm Focus Sprint</span>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  CRITICAL
                </span>
              </div>
              <p className="text-xs text-ink-secondary mb-3">
                Raft Consensus Protocol & Distributed Systems Exam
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-ink-primary h-full rounded-full" style={{ width: '85%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-ink-muted mt-2">
                <span>8.5h prep scheduled</span>
                <span>Deadline: in 18h</span>
              </div>
            </div>

            <div>
              <blockquote className="text-sm font-medium text-ink-primary leading-relaxed">
                "PlanPulse combines project deliverables and study schedules so students and teams never miss a critical milestone."
              </blockquote>
              <p className="text-xs text-ink-faint mt-2">— Academic & Sprint Telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> JWT Encrypted
            </span>
            <span>•</span>
            <span>Zero Overbooking Scheduler</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
