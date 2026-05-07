import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import API from '../../api';
import toast from 'react-hot-toast';

const statusColor = { not_submitted: 'badge-rejected', pending: 'badge-pending', under_review: 'badge-under_review', approved: 'badge-approved', rejected: 'badge-rejected', revision_needed: 'badge-revision_needed' };

export default function AssignmentReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/assignments/${id}/report`)
      .then(r => setReport(r.data))
      .catch(() => toast.error('Could not load report'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!report) return <div className="empty-state"><h3>Report not found</h3></div>;

  const { assignment, summary, rows } = report;

  const downloadCsv = async () => {
    const response = await API.get(`/assignments/${assignment._id}/report.csv`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">{assignment.title}</h1>
        <p className="page-subtitle">{assignment.subject} report for {assignment.department} - Semester {assignment.semester}{assignment.section ? ` - Section ${assignment.section}` : ''}</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Students', value: summary.totalStudents, color: 'var(--accent2)' },
          { label: 'Submitted', value: summary.submitted, color: 'var(--green)' },
          { label: 'Not Submitted', value: summary.notSubmitted, color: 'var(--red)' },
          { label: 'Late', value: summary.late, color: 'var(--yellow)' },
        ].map(item => (
          <div key={item.label} className="stat-card">
            <div className="stat-value" style={{ color: item.color }}>{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Class Submission Report</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Deadline: {new Date(assignment.deadline).toLocaleString('en-IN')}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={downloadCsv} className="btn btn-outline btn-sm">
              Download CSV
            </button>
            <button type="button" onClick={() => window.print()} className="btn btn-outline btn-sm">
              Print / Save PDF
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No.</th>
                <th>Semester</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Review</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.student._id}>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{row.student.name}<br /><span style={{ color: 'var(--text3)', fontSize: 12 }}>{row.student.email}</span></td>
                  <td>{row.student.rollNumber || '-'}</td>
                  <td>{row.student.semester || '-'}</td>
                  <td><span className={`badge ${statusColor[row.status]}`}>{row.status.replace('_', ' ')}</span>{row.late && <span className="badge badge-pending" style={{ marginLeft: 6 }}>Late</span>}</td>
                  <td>{row.submittedAt ? new Date(row.submittedAt).toLocaleString('en-IN') : '-'}</td>
                  <td>{row.submission?.status ? row.submission.status.replace('_', ' ') : '-'}</td>
                  <td>{row.submission ? <Link to={`/projects/${row.submission._id}`} className="btn btn-outline btn-sm">Open</Link> : <span style={{ color: 'var(--text3)' }}>No file</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
