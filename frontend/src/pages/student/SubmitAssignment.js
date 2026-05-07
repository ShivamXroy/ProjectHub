import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import toast from 'react-hot-toast';
import { SubmissionForm } from './SubmitProject';

export default function SubmitAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', subject: '', assignedProfessor: '', techStack: '', githubLink: '', deployedLink: '' });
  const [file, setFile] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    API.get(`/assignments/${id}`)
      .then(({ data }) => {
        setAssignment(data);
        setForm(prev => ({
          ...prev,
          title: data.title,
          subject: data.subject,
          assignedProfessor: data.professor?._id || data.professor || ''
        }));
      })
      .catch(() => toast.error('Could not load assignment'))
      .finally(() => setFetching(false));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Description is required');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('assignment', id);
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
      toast.success('Assignment submitted successfully');
      navigate('/assignments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-center"><div className="spinner" /></div>;
  if (!assignment) return <div className="empty-state"><h3>Assignment not found</h3></div>;

  return (
    <SubmissionForm
      title={`Submit Assignment: ${assignment.title}`}
      subtitle={`${assignment.subject} - due ${new Date(assignment.deadline).toLocaleString('en-IN')}`}
      user={user}
      form={form}
      setForm={setForm}
      handle={handle}
      subjects={[assignment.subject]}
      matchingProfessors={[assignment.professor]}
      file={file}
      setFile={setFile}
      sourceFile={sourceFile}
      setSourceFile={setSourceFile}
      loading={loading}
      submit={submit}
      onCancel={() => navigate('/assignments')}
      fixedSubjectProfessor
    />
  );
}
