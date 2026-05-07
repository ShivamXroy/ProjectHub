import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import toast from 'react-hot-toast';

const statusColor = { pending: 'badge-pending', under_review: 'badge-under_review', approved: 'badge-approved', rejected: 'badge-rejected', revision_needed: 'badge-revision_needed' };

export default function StudentProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/projects').then(r => { setProjects(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await API.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Could not delete project');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">My Projects</h1>
          <p className="page-subtitle">{projects.length} total submission{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/submit" className="btn btn-primary">+ New Submission</Link>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3>No projects submitted yet</h3>
            <p>Start by submitting your first project</p>
            <Link to="/submit" className="btn btn-primary" style={{ marginTop: 16 }}>Submit Project</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {projects.map(p => (
            <div key={p._id} className="card" style={{ transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{p.title}</h3>
                    <span className={`badge ${statusColor[p.status]}`}>{p.status.replace('_', ' ')}</span>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 10, lineHeight: 1.5 }}>
                    {p.description.length > 120 ? p.description.slice(0, 120) + '...' : p.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {p.techStack?.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {p.subject && <span>Subject: {p.subject}</span>}
                    <span>📅 {new Date(p.submittedAt).toLocaleDateString('en-IN')}</span>
                    {p.assignedProfessor && <span>👨‍🏫 {p.assignedProfessor.name}</span>}
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent2)' }}>🔗 GitHub</a>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
                  <Link to={`/projects/${p._id}`} className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>View Details</Link>
                  {p.status === 'revision_needed' && (
                    <Link to={`/projects/${p._id}/resubmit`} className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }}>Resubmit</Link>
                  )}
                  {p.status === 'pending' && (
                    <button onClick={() => handleDelete(p._id)} className="btn btn-danger btn-sm" style={{ justifyContent: 'center' }}>Delete</button>
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
