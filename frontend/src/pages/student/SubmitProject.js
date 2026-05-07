import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import toast from 'react-hot-toast';

export default function SubmitProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', subject: '', assignedProfessor: '', techStack: '', githubLink: '', deployedLink: ''
  });
  const [professors, setProfessors] = useState([]);
  const [file, setFile] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    API.get('/users/professors')
      .then(r => setProfessors(r.data))
      .catch(() => toast.error('Could not load professors'));
  }, []);

  const subjects = useMemo(() => {
    const allSubjects = professors.flatMap(professor => professor.subjectSpecializations || []);
    return [...new Set(allSubjects.map(subject => subject.trim()).filter(Boolean))].sort();
  }, [professors]);

  const matchingProfessors = professors.filter(professor =>
    (professor.subjectSpecializations || []).some(subject =>
      subject.trim().toLowerCase() === form.subject.trim().toLowerCase()
    )
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Title and description are required');
    if (!form.subject) return toast.error('Please select a subject');
    if (!form.assignedProfessor) return toast.error('Please select the assigned professor');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('subject', form.subject);
      fd.append('assignedProfessor', form.assignedProfessor);
      fd.append('techStack', JSON.stringify(form.techStack.split(',').map(t => t.trim()).filter(Boolean)));
      fd.append('githubLink', form.githubLink);
      fd.append('deployedLink', form.deployedLink);
      if (file) fd.append('document', file);
      if (sourceFile) fd.append('sourceCode', sourceFile);

      await API.post('/projects', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Project submitted successfully');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubmissionForm
      title="Submit New Project"
      subtitle="Submit an independent project to an assigned professor"
      user={user}
      form={form}
      setForm={setForm}
      handle={handle}
      subjects={subjects}
      matchingProfessors={matchingProfessors}
      file={file}
      setFile={setFile}
      sourceFile={sourceFile}
      setSourceFile={setSourceFile}
      loading={loading}
      submit={submit}
      onCancel={() => navigate('/projects')}
    />
  );
}

export function SubmissionForm({ title, subtitle, user, form, setForm, handle, subjects, matchingProfessors, file, setFile, sourceFile, setSourceFile, loading, submit, onCancel, fixedSubjectProfessor = false }) {
  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <div className="card">
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input value={user?.department || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <input value={user?.semester || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select name="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value, assignedProfessor: '' })} disabled={fixedSubjectProfessor} required>
                <option value="">Select Subject</option>
                {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Professor *</label>
            <select name="assignedProfessor" value={form.assignedProfessor} onChange={handle} disabled={!form.subject || fixedSubjectProfessor} required>
              <option value="">{form.subject ? 'Select Professor' : 'Select a subject first'}</option>
              {matchingProfessors.map(professor => (
                <option key={professor._id} value={professor._id}>{professor.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input name="title" placeholder="e.g. Student Project Review System" value={form.title} onChange={handle} required />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea name="description" placeholder="Describe your project, files, features, and what to review..." value={form.description} onChange={handle} rows={5} required style={{ resize: 'vertical', minHeight: 120 }} />
          </div>

          <div className="form-group">
            <label className="form-label">Tech Stack</label>
            <input name="techStack" placeholder="React, Node.js, MongoDB (comma separated)" value={form.techStack} onChange={handle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">GitHub Link</label>
              <input name="githubLink" placeholder="https://github.com/..." value={form.githubLink} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">Deployed Link</label>
              <input name="deployedLink" placeholder="https://your-app.netlify.app" value={form.deployedLink} onChange={handle} />
            </div>
          </div>

          <FileDrop label="Project Document (PDF/DOC - Max 10MB)" file={file} setFile={setFile} inputId="fileInput" accept=".pdf,.doc,.docx" emptyText="Click or drag & drop your document" />
          <FileDrop label="Source Code File (ZIP or code file - Max 10MB)" file={sourceFile} setFile={setSourceFile} inputId="sourceInput" accept=".zip,.js,.jsx,.ts,.tsx,.html,.css,.json,.py,.java,.c,.cpp,.md,.txt" emptyText="Upload ZIP or a main source file" />

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-outline" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, justifyContent: 'center', padding: '12px' }}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FileDrop({ label, file, setFile, inputId, accept, emptyText }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ border: `2px dashed ${file ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: 'var(--radius-sm)', padding: 24, textAlign: 'center', cursor: 'pointer', background: file ? 'var(--accent-glow)' : 'transparent', transition: 'all 0.2s' }}
        onClick={() => document.getElementById(inputId).click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
      >
        <input id={inputId} type="file" accept={accept} onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} />
        {file ? (
          <div>
            <div style={{ color: 'var(--accent2)', fontWeight: 600 }}>{file.name}</div>
            <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ marginTop: 8, background: 'var(--red-bg)', color: 'var(--red)', border: 'none', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Remove</button>
          </div>
        ) : (
          <div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>{emptyText}</div>
            <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>Professor can preview code files or download archives</div>
          </div>
        )}
      </div>
    </div>
  );
}
