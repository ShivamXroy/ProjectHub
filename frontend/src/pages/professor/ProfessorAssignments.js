import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import toast from 'react-hot-toast';

export default function ProfessorAssignments() {
const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', subject: '', department: user?.department || '', semester: '', section: '', deadline: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAssignments = () => {
    API.get('/assignments')
      .then(r => setAssignments(r.data))
      .catch(() => toast.error('Could not load assignments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject || !form.department || !form.semester || !form.deadline) return toast.error('Title, subject, department, semester, and deadline are required');
    setSaving(true);
    try {
      const { data } = await API.post('/assignments', form);
      setAssignments(prev => [data, ...prev]);
      setForm({ title: '', description: '', subject: '', department: user?.department || '', semester: '', section: '', deadline: '' });
      toast.success('Assignment topic created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Assignment Topics</h1>
        <p className="page-subtitle">Create submission headings and track class completion</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Topic / Heading *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Assignment Unit 4" required />
            </div>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required>
                <option value="">Select Subject</option>
                {(user?.subjectSpecializations || []).map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Target Department *</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
                <option value="">Select Department</option>
                <option>Computer Science</option>
                <option>Information Technology</option>
                <option>Electronics</option>
                <option>Mechanical</option>
                <option>Civil</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required>
                <option value="">Select Semester</option>
                {['1','2','3','4','5','6','7','8'].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Section / Class</label>
              <input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="Blank for all sections" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Submission instructions, expected files, rubric notes..." />
          </div>
          <div className="form-group">
            <label className="form-label">Deadline *</label>
            <input type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Assignment'}</button>
        </form>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : assignments.length === 0 ? (
        <div className="card"><div className="empty-state"><h3>No assignment topics yet</h3><p>Create a topic so students can submit under it.</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {assignments.map(assignment => (
            <div key={assignment._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{assignment.title}</h3>
                  <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{assignment.description || 'No description provided.'}</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'var(--text3)' }}>
                    <span>Subject: {assignment.subject}</span>
                    <span>Dept: {assignment.department}</span>
                    <span>Sem: {assignment.semester}</span>
                    {assignment.section && <span>Section: {assignment.section}</span>}
                    <span>Due: {new Date(assignment.deadline).toLocaleString('en-IN')}</span>
                    <span>Submissions: {assignment.submissionCount || 0}</span>
                  </div>
                </div>
                <Link to={`/assignments/${assignment._id}/report`} className="btn btn-outline btn-sm">Open Report</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
