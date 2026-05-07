import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api';
import toast from 'react-hot-toast';

export default function ReviewProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({ feedback: '', rating: 7, verdict: 'approved' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    API.get(`/projects/${id}`).then(r => { setProject(r.data); setFetching(false); }).catch(() => setFetching(false));
  }, [id]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.feedback.trim()) return toast.error('Please write feedback');
    setLoading(true);
    try {
      await API.post(`/reviews/${id}`, { ...form, rating: Number(form.rating) });
      toast.success('Review submitted successfully! ✅');
      navigate(`/projects/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  const verdictOptions = [
    { value: 'approved', label: '✅ Approved', desc: 'Project meets all requirements', color: 'var(--green)' },
    { value: 'revision_needed', label: '🔄 Revision Needed', desc: 'Needs changes before final approval', color: 'var(--yellow)' },
    { value: 'rejected', label: '❌ Rejected', desc: 'Does not meet requirements', color: 'var(--red)' },
  ];

  const ratingColor = form.rating >= 8 ? 'var(--green)' : form.rating >= 5 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ marginBottom: 20 }}>
        ← Back
      </button>

      <div className="page-header">
        <h1 className="page-title">Write Review</h1>
        <p className="page-subtitle">Reviewing: {project.title}</p>
      </div>

      {/* Project summary */}
      <div className="card" style={{ marginBottom: 20, background: 'var(--bg3)' }}>
        <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Project Summary</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{project.title}</h3>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>
          {project.description.slice(0, 200)}{project.description.length > 200 ? '...' : ''}
        </p>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text3)', flexWrap: 'wrap' }}>
          <span>👨‍🎓 {project.student?.name}</span>
          <span>🎓 {project.student?.rollNumber || '—'}</span>
          {project.subject && <span>Subject: {project.subject}</span>}
          {project.githubLink && <a href={project.githubLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent2)' }}>🔗 GitHub</a>}
          {project.deployedLink && <a href={project.deployedLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent2)' }}>🌐 Demo</a>}
        </div>
      </div>

      {/* Review form */}
      <div className="card">
        <form onSubmit={submit}>
          {/* Verdict */}
          <div className="form-group">
            <label className="form-label">Verdict *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {verdictOptions.map(v => (
                <button key={v.value} type="button"
                  onClick={() => setForm({ ...form, verdict: v.value })}
                  style={{
                    padding: '12px 8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `2px solid ${form.verdict === v.value ? v.color : 'var(--border2)'}`,
                    background: form.verdict === v.value ? `${v.color}15` : 'transparent',
                    color: form.verdict === v.value ? v.color : 'var(--text2)',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                  }}>
                  <div>{v.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3, opacity: 0.8 }}>{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Rating
              <span style={{ color: ratingColor, fontWeight: 700, fontSize: 18 }}>{form.rating}/10</span>
            </label>
            <input type="range" name="rating" min="1" max="10" value={form.rating} onChange={handle}
              style={{
                width: '100%', height: 6, borderRadius: 3, outline: 'none',
                background: `linear-gradient(to right, ${ratingColor} 0%, ${ratingColor} ${(form.rating - 1) * 11.1}%, var(--border2) ${(form.rating - 1) * 11.1}%)`,
                border: 'none', cursor: 'pointer', padding: 0
              }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              <span>1 - Poor</span><span>5 - Average</span><span>10 - Excellent</span>
            </div>
          </div>

          {/* Feedback */}
          <div className="form-group">
            <label className="form-label">Detailed Feedback *</label>
            <textarea name="feedback" value={form.feedback} onChange={handle} rows={7}
              placeholder="Write detailed feedback for the student. Include:&#10;• What was done well&#10;• Areas that need improvement&#10;• Specific suggestions for changes&#10;• Technical observations"
              style={{ resize: 'vertical', minHeight: 160 }} required />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="button" className="btn btn-outline"
              onClick={() => navigate(-1)} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}
              style={{ flex: 2, justifyContent: 'center', padding: '13px' }}>
              {loading ? 'Submitting Review...' : '✅ Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
