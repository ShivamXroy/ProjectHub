import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api';
import toast from 'react-hot-toast';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [filters, setFilters] = useState({ subject: '', professor: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/assignments')
      .then(r => setAssignments(r.data))
      .catch(() => toast.error('Could not load assignments'))
      .finally(() => setLoading(false));
  }, []);

  const subjects = useMemo(() => [...new Set(assignments.map(a => a.subject).filter(Boolean))].sort(), [assignments]);
  const professors = useMemo(() => {
    const map = new Map();
    assignments.forEach(a => {
      if (a.professor?._id) map.set(a.professor._id, a.professor);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments]);

  const filteredAssignments = assignments.filter(assignment => {
    const subjectMatch = !filters.subject || assignment.subject === filters.subject;
    const professorMatch = !filters.professor || assignment.professor?._id === filters.professor;
    return subjectMatch && professorMatch;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Assignments</h1>
        <p className="page-subtitle">Submission topics created by your department professors</p>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Subject</label>
            <select value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value, professor: '' })}>
              <option value="">All Subjects</option>
              {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Professor</label>
            <select value={filters.professor} onChange={e => setFilters({ ...filters, professor: e.target.value })}>
              <option value="">All Professors</option>
              {professors
                .filter(professor => !filters.subject || assignments.some(a => a.subject === filters.subject && a.professor?._id === professor._id))
                .map(professor => <option key={professor._id} value={professor._id}>{professor.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filteredAssignments.length === 0 ? (
        <div className="card"><div className="empty-state"><h3>No assignments yet</h3><p>Your professors have not created any submission topics.</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredAssignments.map(assignment => {
            const deadlinePassed = new Date(assignment.deadline) < new Date();
            return (
              <div key={assignment._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{assignment.title}</h3>
                    <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>
                      {assignment.description || 'No description provided.'}
                    </p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'var(--text3)' }}>
                      <span>Subject: {assignment.subject}</span>
                      <span>Semester: {assignment.semester}</span>
                      {assignment.section && <span>Section: {assignment.section}</span>}
                      <span>Professor: {assignment.professor?.name}</span>
                      <span>Due: {new Date(assignment.deadline).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div style={{ minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {assignment.mySubmission ? (
                      <Link to={`/projects/${assignment.mySubmission._id}`} className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>
                        View Submission
                      </Link>
                    ) : deadlinePassed ? (
                      <button className="btn btn-outline btn-sm" disabled>Deadline Passed</button>
                    ) : (
                      <Link to={`/assignments/${assignment._id}/submit`} className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }}>
                        Submit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
