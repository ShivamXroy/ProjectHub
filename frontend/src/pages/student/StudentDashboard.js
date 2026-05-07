import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import toast from 'react-hot-toast';

const statusColor = { pending: 'badge-pending', under_review: 'badge-under_review', approved: 'badge-approved', rejected: 'badge-rejected', revision_needed: 'badge-revision_needed' };

export default function StudentDashboard() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/projects').then(r => { setProjects(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'pending').length,
    under_review: projects.filter(p => p.status === 'under_review').length,
    approved: projects.filter(p => p.status === 'approved').length,
    revision: projects.filter(p => p.status === 'revision_needed').length,
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account and all your submissions? This cannot be undone.')) return;
    try {
      await deleteAccount();
      toast.success('Account deleted');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete account');
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">Here's an overview of your project submissions</p>
        <button type="button" onClick={handleDeleteAccount} className="btn btn-danger btn-sm" style={{ marginTop: 12 }}>Delete Account</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Submissions', value: stats.total, color: 'var(--accent2)' },
          { label: 'Pending Review', value: stats.pending, color: 'var(--yellow)' },
          { label: 'Under Review', value: stats.under_review, color: 'var(--blue)' },
          { label: 'Approved', value: stats.approved, color: 'var(--green)' },
          { label: 'Needs Revision', value: stats.revision, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent projects */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Recent Projects</h2>
          <Link to="/submit" className="btn btn-primary btn-sm">+ New Submission</Link>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3>No projects yet</h3>
            <p>Submit your first project to get started</p>
            <Link to="/submit" className="btn btn-primary" style={{ marginTop: 16 }}>Submit Project</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Status</th>
                  <th>Professor</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map(p => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{p.title}</td>
                    <td><span className={`badge ${statusColor[p.status]}`}>{p.status.replace('_', ' ')}</span></td>
                    <td>{p.assignedProfessor?.name || <span style={{ color: 'var(--text3)' }}>Not assigned</span>}</td>
                    <td>{new Date(p.submittedAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <Link to={`/projects/${p._id}`} className="btn btn-outline btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info card */}
      <div style={{
        marginTop: 20, padding: 20,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
        border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius)',
        display: 'flex', alignItems: 'flex-start', gap: 14
      }}>
        <div style={{ fontSize: 24 }}>💡</div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>How it works</div>
          <div style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
            Submit your project → Professor reviews it → Get feedback → Make revisions if needed → Final approval!
          </div>
        </div>
      </div>
    </div>
  );
}
