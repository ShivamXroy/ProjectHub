import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 50%)',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, color: 'white',
            margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>S</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 6 }}>
            Student Project Review System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 32, boxShadow: 'var(--shadow)'
        }}>
          {error && (
            <div style={{
              background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: 'var(--red)', fontSize: 13
            }}>{error}</div>
          )}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input name="password" type="password" placeholder="••••••••"
                value={form.password} onChange={handle} required />
            </div>

            <button type="submit" className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick login hints */}
          <div style={{
            marginTop: 20, padding: 14,
            background: 'var(--bg3)', borderRadius: 8,
            border: '1px solid var(--border2)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Demo Accounts
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, fontFamily: 'var(--mono)' }}>
              <div>👨‍🎓 Student: student@demo.com / demo123</div>
              <div>👨‍🏫 Professor: prof@demo.com / demo123</div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text3)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent2)', fontWeight: 600 }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
