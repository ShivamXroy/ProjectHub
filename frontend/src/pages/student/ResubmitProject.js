import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import toast from 'react-hot-toast';
import { SubmissionForm } from './SubmitProject';

export default function ResubmitProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', subject: '', assignedProfessor: '', techStack: '', githubLink: '', deployedLink: '' });
  const [file, setFile] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    API.get(`/projects/${id}`)
      .then(({ data }) => {
        setProject(data);
        setForm({
          title: data.title,
          description: data.description,
          subject: data.subject || '',
          assignedProfessor: data.assignedProfessor?._id || '',
          techStack: (data.techStack || []).join(', '),
          githubLink: data.githubLink || '',
          deployedLink: data.deployedLink || ''
        });
      })
      .catch(() => toast.error('Could not load project'))
      .finally(() => setFetching(false));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('techStack', JSON.stringify(form.techStack.split(',').map(t => t.trim()).filter(Boolean)));
      fd.append('githubLink', form.githubLink);
      fd.append('deployedLink', form.deployedLink);
      if (file) fd.append('document', file);
      if (sourceFile) fd.append('sourceCode', sourceFile);

      await API.put(`/projects/${id}/resubmit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Resubmitted for review');
      navigate(`/projects/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resubmission failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  return (
    <SubmissionForm
      title={`Resubmit: ${project.title}`}
      subtitle="Upload revised files after professor requested changes"
      user={user}
      form={form}
      setForm={setForm}
      handle={handle}
      subjects={[project.subject]}
      matchingProfessors={[project.assignedProfessor]}
      file={file}
      setFile={setFile}
      sourceFile={sourceFile}
      setSourceFile={setSourceFile}
      loading={loading}
      submit={submit}
      onCancel={() => navigate(`/projects/${id}`)}
      fixedSubjectProfessor
    />
  );
}
