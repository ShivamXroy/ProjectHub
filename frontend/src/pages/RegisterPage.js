import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student',
    rollNumber: '', department: '', section: '', semester: '', subjectSpecializations: ''
  });
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    const res = await register(form);
    if (res.success) {
      toast.success('Account created. Please sign in.');
      navigate('/login');
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%)',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 460, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: 'white',
            margin: '0 auto 14px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>S</div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Create Account</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>Join SPRS today</p>
        </div>

        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 28, boxShadow: 'var(--shadow)'
        }}>
          {error && (
            <div style={{
              background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: 'var(--red)', fontSize: 13
            }}>{error}</div>
          )}

          <form onSubmit={submit}>
            {/* Role selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {['student', 'professor'].map(r => (
                <button key={r} type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  style={{
                    padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: `2px solid ${form.role === r ? 'var(--accent)' : 'var(--border2)'}`,
                    background: form.role === r ? 'var(--accent-glow)' : 'transparent',
                    color: form.role === r ? 'var(--accent2)' : 'var(--text2)',
                    cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
                  }}>
                  {r === 'student' ? '👨‍🎓' : '👨‍🏫'} {r}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" placeholder="Rahul Sharma" value={form.name} onChange={handle} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
            </div>

            {form.role === 'student' && (
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input name="rollNumber" placeholder="e.g. 21CS001" value={form.rollNumber} onChange={handle} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Department</label>
              <select name="department" value={form.department} onChange={handle}>
                <option value="">Select Department</option>
                <option>Computer Science</option>
                <option>Information Technology</option>
                <option>Electronics</option>
                <option>Mechanical</option>
                <option>Civil</option>
              </select>
            </div>

            {form.role === 'student' && (
              <div className="form-group">
                <label className="form-label">Section / Class</label>
                <input name="section" placeholder="e.g. A or CSE-3A" value={form.section} onChange={handle} />
              </div>
            )}

            {form.role === 'student' && (
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select name="semester" value={form.semester} onChange={handle} required>
                  <option value="">Select Semester</option>
                  {['1','2','3','4','5','6','7','8'].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                </select>
              </div>
            )}

            {form.role === 'professor' && (
              <div className="form-group">
                <label className="form-label">Assigned Subjects</label>
                <input
                  name="subjectSpecializations"
                  placeholder="Python, Software Engineering, DBMS"
                  value={form.subjectSpecializations}
                  onChange={handle}
                  required
                />
                <span style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                  Separate subjects with commas
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input name="password" type="password" placeholder="Min 6 characters"
                value={form.password} onChange={handle} required />
            </div>

            <button type="submit" className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--text3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent2)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
