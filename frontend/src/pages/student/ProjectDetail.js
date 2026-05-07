import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import toast from 'react-hot-toast';

const statusColor = { pending: 'badge-pending', under_review: 'badge-under_review', approved: 'badge-approved', rejected: 'badge-rejected', revision_needed: 'badge-revision_needed' };

const ratingColor = (r) => {
  if (r >= 8) return 'var(--green)';
  if (r >= 5) return 'var(--yellow)';
  return 'var(--red)';
};

const apiRoot = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sourcePreview, setSourcePreview] = useState(null);
  const [sourceTree, setSourceTree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([API.get(`/projects/${id}`), API.get(`/reviews/${id}`)])
      .then(([pr, rv]) => { setProject(pr.data); setReviews(rv.data); })
      .catch(() => toast.error('Could not load project'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAssign = async () => {
    try {
      const { data } = await API.put(`/projects/${id}/assign`);
      setProject(data);
      toast.success('Project assigned to you');
    } catch {
      toast.error('Could not assign project');
    }
  };

  const loadSourcePreview = async () => {
    try {
      if (project.sourceCodeFile?.toLowerCase().endsWith('.zip')) {
        const { data } = await API.get(`/projects/${id}/source/tree`);
        setSourceTree(data);
        setSourcePreview(null);
        return;
      }
      const { data } = await API.get(`/projects/${id}/source`);
      setSourcePreview(data);
    } catch (err) {
      const downloadUrl = err.response?.data?.downloadUrl;
      if (downloadUrl) {
        window.open(`${apiRoot}${downloadUrl}`, '_blank');
      } else {
        toast.error(err.response?.data?.message || 'Could not load source code');
      }
    }
  };

  const loadZipFile = async (filePath) => {
    try {
      const { data } = await API.get(`/projects/${id}/source/file`, { params: { path: filePath } });
      setSourcePreview(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not preview this file');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  return (
    <div className="fade-in" style={{ maxWidth: 820 }}>
      <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ marginBottom: 20 }}>
        Back
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{project.title}</h1>
            <span className={`badge ${statusColor[project.status]}`} style={{ fontSize: 13 }}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          {user.role === 'professor' && !project.assignedProfessor && (
            <button onClick={handleAssign} className="btn btn-primary">Take for Review</button>
          )}
          {user.role === 'professor' && project.assignedProfessor?._id === user._id && (
            <Link to={`/projects/${id}/review`} className="btn btn-success">Write Review</Link>
          )}
          {user.role === 'student' && project.status === 'revision_needed' && (
            <Link to={`/projects/${id}/resubmit`} className="btn btn-primary">Resubmit</Link>
          )}
        </div>

        <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginBottom: 16 }}>{project.description}</p>

        {project.techStack?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tech Stack</div>
            <div>{project.techStack.map(t => <span key={t} className="tag">{t}</span>)}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 16, background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
          <InfoItem label="Student" value={project.student?.name} />
          <InfoItem label="Roll No." value={project.student?.rollNumber || '-'} />
          <InfoItem label="Department" value={project.student?.department || '-'} />
          <InfoItem label="Section" value={project.student?.section || '-'} />
          <InfoItem label="Semester" value={project.student?.semester || '-'} />
          <InfoItem label="Subject" value={project.subject || '-'} />
          <InfoItem label="Assignment" value={project.assignment?.title || 'General submission'} />
          <InfoItem label="Assigned To" value={project.assignedProfessor?.name || 'Not assigned'} />
          <InfoItem label="Submitted" value={new Date(project.submittedAt).toLocaleDateString('en-IN')} />
          <InfoItem label="Last Updated" value={new Date(project.updatedAt).toLocaleDateString('en-IN')} />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {project.githubLink && <a href={project.githubLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">GitHub Repository</a>}
          {project.deployedLink && <a href={project.deployedLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Live Demo</a>}
          {project.documentFile && (
            <a href={`${apiRoot}/uploads/${project.documentFile}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View Document</a>
          )}
          {project.sourceCodeFile && (
            <>
              <button type="button" onClick={loadSourcePreview} className="btn btn-outline btn-sm">View Source Code</button>
              <a href={`${apiRoot}/uploads/${project.sourceCodeFile}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Download Source</a>
            </>
          )}
        </div>
      </div>

      {sourcePreview && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{sourcePreview.filename}</h2>
            <button type="button" onClick={() => setSourcePreview(null)} className="btn btn-outline btn-sm">Close</button>
          </div>
          <pre style={{
            maxHeight: 420,
            overflow: 'auto',
            background: 'var(--bg)',
            border: '1px solid var(--border2)',
            borderRadius: 8,
            padding: 16,
            color: 'var(--text2)',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>{sourcePreview.content}</pre>
        </div>
      )}

      {sourceTree && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{sourceTree.filename}</h2>
            <button type="button" onClick={() => setSourceTree(null)} className="btn btn-outline btn-sm">Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 320px) 1fr', gap: 16 }}>
            <div style={{ maxHeight: 420, overflow: 'auto', border: '1px solid var(--border2)', borderRadius: 8 }}>
              {sourceTree.entries.map(entry => (
                <button key={entry.name} type="button" onClick={() => entry.previewable && loadZipFile(entry.name)} disabled={!entry.previewable}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: 'transparent', color: entry.previewable ? 'var(--text2)' : 'var(--text3)', borderBottom: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--mono)' }}>
                  {entry.name}
                </button>
              ))}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 14, lineHeight: 1.6 }}>
              Select a previewable file from the ZIP tree. Non-code files can still be downloaded from the source archive.
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
          Review History ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <p>No reviews yet. Waiting for professor feedback.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reviews.map(r => (
              <div key={r._id} style={{
                padding: 16, background: 'var(--bg3)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.professor?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(r.reviewedAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{
                      fontWeight: 800, fontSize: 18, color: ratingColor(r.rating),
                      background: 'var(--bg)', padding: '4px 12px', borderRadius: 8,
                      border: `1px solid ${ratingColor(r.rating)}33`
                    }}>
                      {r.rating}/10
                    </div>
                    <span className={`badge ${statusColor[r.verdict]}`}>{r.verdict.replace('_', ' ')}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text2)', lineHeight: 1.6, fontSize: 14 }}>{r.feedback}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
