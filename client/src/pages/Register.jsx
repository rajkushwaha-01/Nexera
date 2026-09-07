import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, ArrowRight, User, Users, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    title: 'Computer Science Major',
    department: 'Engineering',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    let title = 'Student';
    if (role === 'member') title = 'Team Member';
    if (role === 'admin') title = 'Project Manager / Admin';
    setFormData({ ...formData, role, title });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await register(formData);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-subtle flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-lg bg-white border border-line rounded-2xl shadow-ambient-lg p-8 lg:p-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-ink-primary flex items-center justify-center text-white shadow-ambient">
            <Target className="w-4 h-4 text-brand-100" />
          </div>
          <span className="font-bold text-ink-primary tracking-tight text-lg">PlanPulse</span>
        </div>

        <h1 className="text-2xl font-bold text-ink-primary tracking-tight mb-1">
          Create your account
        </h1>
        <p className="text-xs text-ink-muted leading-relaxed mb-6">
          Start monitoring projects and organizing your academic schedule.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Alex Johnson"
              className="w-full px-3 py-2 text-xs bg-canvas-subtle border border-line rounded-lg text-ink-primary placeholder:text-ink-faint focus:outline-none focus:bg-white focus:border-line-strong transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@university.edu"
              className="w-full px-3 py-2 text-xs bg-canvas-subtle border border-line rounded-lg text-ink-primary placeholder:text-ink-faint focus:outline-none focus:bg-white focus:border-line-strong transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-xs bg-canvas-subtle border border-line rounded-lg text-ink-primary placeholder:text-ink-faint focus:outline-none focus:bg-white focus:border-line-strong transition-colors"
            />
          </div>

          {/* Account Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1.5">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('student')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs transition-all ${
                  formData.role === 'student'
                    ? 'border-ink-primary bg-slate-100 font-semibold text-ink-primary shadow-ambient'
                    : 'border-line bg-canvas-subtle text-ink-secondary hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4 mb-1 text-ink-muted" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('member')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs transition-all ${
                  formData.role === 'member'
                    ? 'border-ink-primary bg-slate-100 font-semibold text-ink-primary shadow-ambient'
                    : 'border-line bg-canvas-subtle text-ink-secondary hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 mb-1 text-ink-muted" />
                <span>Team Member</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs transition-all ${
                  formData.role === 'admin'
                    ? 'border-ink-primary bg-slate-100 font-semibold text-ink-primary shadow-ambient'
                    : 'border-line bg-canvas-subtle text-ink-secondary hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 mb-1 text-ink-muted" />
                <span>Project Lead</span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading}
            className="w-full justify-center mt-2"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </form>

        <p className="text-xs text-ink-muted text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
