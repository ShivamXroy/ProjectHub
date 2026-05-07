import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import toast from 'react-hot-toast';

const statusColor = { pending: 'badge-pending', under_review: 'badge-under_review', approved: 'badge-approved', rejected: 'badge-rejected', revision_needed: 'badge-revision_needed' };

export default function ProfessorDashboard() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/projects').then(r => { setProjects(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const mine = projects.filter(p => p.assignedProfessor?._id === user._id);
  const pending = projects.filter(p => p.status === 'pending');
  const approved = projects.filter(p => p.status === 'approved');

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your professor account, assignments, reviews, and assigned submissions? This cannot be undone.')) return;
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
      <div className="page-header">
        <h1 className="page-title">Professor Dashboard 👨‍🏫</h1>
        <p className="page-subtitle">Manage and review student project submissions</p>
        <button type="button" onClick={handleDeleteAccount} className="btn btn-danger btn-sm" style={{ marginTop: 12 }}>Delete Account</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Projects', value: projects.length, color: 'var(--accent2)' },
          { label: 'Awaiting Review', value: pending.length, color: 'var(--yellow)' },
          { label: 'Under My Review', value: mine.filter(p => p.status === 'under_review').length, color: 'var(--blue)' },
          { label: 'Approved', value: approved.length, color: 'var(--green)' },
          { label: 'My Total Assigned', value: mine.length, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pending projects needing attention */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--yellow)', display: 'inline-block' }} />
            Pending Projects
          </h2>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 14 }}>
              All caught up! ✅
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.slice(0, 5).map(p => (
                <Link key={p._id} to={`/projects/${p._id}`} style={{
                  display: 'block', padding: 12,
                  background: 'var(--bg3)', borderRadius: 8,
                  border: '1px solid var(--border2)',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    👨‍🎓 {p.student?.name} · {p.subject || 'No subject'} · {new Date(p.submittedAt).toLocaleDateString('en-IN')}
                  </div>
                </Link>
              ))}
              {pending.length > 5 && (
                <Link to="/projects" style={{ fontSize: 13, color: 'var(--accent2)', textAlign: 'center', paddingTop: 4 }}>
                  +{pending.length - 5} more →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* My active reviews */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
            My Active Reviews
          </h2>
          {mine.filter(p => p.status === 'under_review').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 14 }}>
              No active reviews
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mine.filter(p => p.status === 'under_review').map(p => (
                <div key={p._id} style={{
                  padding: 12, background: 'var(--bg3)', borderRadius: 8,
                  border: '1px solid var(--border2)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>👨‍🎓 {p.student?.name} · {p.subject || 'No subject'}</div>
                  <Link to={`/projects/${p._id}/review`} className="btn btn-success btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    Write Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent all projects */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>All Recent Submissions</h2>
          <Link to="/projects" className="btn btn-outline btn-sm">View All</Link>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th><th>Student</th><th>Subject</th><th>Status</th><th>Submitted</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 6).map(p => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{p.title}</td>
                    <td>{p.student?.name}<br /><span style={{ fontSize: 11, color: 'var(--text3)' }}>{p.student?.rollNumber}</span></td>
                    <td>{p.subject || '—'}</td>
                    <td><span className={`badge ${statusColor[p.status]}`}>{p.status.replace('_', ' ')}</span></td>
                    <td>{new Date(p.submittedAt).toLocaleDateString('en-IN')}</td>
                    <td><Link to={`/projects/${p._id}`} className="btn btn-outline btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
