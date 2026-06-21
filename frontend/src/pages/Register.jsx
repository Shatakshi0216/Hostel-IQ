import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register(name, email, password, role);
      if (res.success) {
        if (res.data.role === 'Student') {
          navigate('/student/portal');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-xl shadow-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-teal flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-sm mb-3">
            H
          </div>
          <h2 className="text-2xl font-bold text-brand-dark tracking-tight">Create an Account</h2>
          <p className="text-xs text-slate-500 mt-1">Get started with HostelIQ portal</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="premium-input text-xs"
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="premium-input text-xs"
              placeholder="e.g. rahul@university.edu"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="premium-input text-xs"
            >
              <option value="Student">Student (Default)</option>
              <option value="HostelAdmin">Hostel Administrator</option>
              <option value="SuperAdmin">Super Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="premium-input text-xs"
              placeholder="•••••••• (Min. 6 characters)"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-teal hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
