import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import toast from 'react-hot-toast';

const statusColor = { pending: 'badge-pending', under_review: 'badge-under_review', approved: 'badge-approved', rejected: 'badge-rejected', revision_needed: 'badge-revision_needed' };
const STATUSES = ['all', 'pending', 'under_review', 'approved', 'revision_needed', 'rejected'];

export default function ProfessorProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/projects').then(r => { setProjects(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleAssign = async (id) => {
    try {
      const { data } = await API.put(`/projects/${id}/assign`);
      setProjects(prev => prev.map(p => p._id === id ? data : p));
      toast.success('Project assigned to you!');
    } catch {
      toast.error('Assignment failed');
    }
  };

  const filtered = projects.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.student?.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">All Student Projects</h1>
        <p className="page-subtitle">{projects.length} total submissions</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="🔍 Search by title or student..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280, flex: 1 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${filter === s ? 'var(--accent)' : 'var(--border2)'}`,
                background: filter === s ? 'var(--accent-glow)' : 'transparent',
                color: filter === s ? 'var(--accent2)' : 'var(--text2)',
                cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
              }}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3>No projects found</h3>
            <p>Try changing the filter or search term</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(p => (
            <div key={p._id} className="card">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.title}</h3>
                    <span className={`badge ${statusColor[p.status]}`}>{p.status.replace('_', ' ')}</span>
                    {p.assignedProfessor?._id === user._id && (
                      <span style={{ fontSize: 11, color: 'var(--accent2)', background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>My Review</span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
                    {p.description.length > 100 ? p.description.slice(0, 100) + '...' : p.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {p.techStack?.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>👨‍🎓 {p.student?.name} {p.student?.rollNumber && `(${p.student.rollNumber})`}</span>
                    {p.subject && <span>Subject: {p.subject}</span>}
                    {p.student?.department && <span>Dept: {p.student.department}</span>}
                    <span>📅 {new Date(p.submittedAt).toLocaleDateString('en-IN')}</span>
                    {p.assignedProfessor && <span>👨‍🏫 {p.assignedProfessor.name}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                  <Link to={`/projects/${p._id}`} className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>
                    View Details
                  </Link>
                  {!p.assignedProfessor && p.status === 'pending' && (
                    <button onClick={() => handleAssign(p._id)} className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }}>
                      Take for Review
                    </button>
                  )}
                  {p.assignedProfessor?._id === user._id && (
                    <Link to={`/projects/${p._id}/review`} className="btn btn-success btn-sm" style={{ justifyContent: 'center' }}>
                      Write Review
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
