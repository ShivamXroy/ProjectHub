const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const { protect, professorOnly } = require('../middleware/auth');

const normalize = (value) => String(value || '').trim().toLowerCase();

const professorHandlesSubject = (professor, subject) => {
  if (!subject) return true;
  return (professor.subjectSpecializations || []).some(item => normalize(item) === normalize(subject));
};

const canProfessorAccessProject = (project, professor) => {
  const sameDepartment = normalize(project.student?.department) === normalize(professor.department);
  if (!sameDepartment) return false;
  if (!project.assignedProfessor) return professorHandlesSubject(professor, project.subject);
  const assignedId = project.assignedProfessor._id || project.assignedProfessor;
  return assignedId.toString() === professor._id.toString();
};

const canUserAccessProject = (project, user) => {
  if (user.role === 'student') return project.student._id.toString() === user._id.toString();
  if (user.role === 'professor') return canProfessorAccessProject(project, user);
  return false;
};

router.post('/:projectId', protect, professorOnly, async (req, res) => {
  try {
    const { feedback, rating, verdict } = req.body;
    const project = await Project.findById(req.params.projectId).populate('student', 'department');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canProfessorAccessProject(project, req.user)) {
      return res.status(403).json({ message: 'This project is not assigned to you' });
    }

    const review = await Review.create({
      project: req.params.projectId,
      professor: req.user._id,
      feedback,
      rating,
      verdict
    });

    project.status = verdict;
    project.assignedProfessor = req.user._id;
    await project.save();

    await Notification.create({
      user: project.student._id || project.student,
      type: verdict === 'revision_needed' ? 'revision_needed' : 'review_submitted',
      title: verdict === 'revision_needed' ? 'Revision requested' : 'Review submitted',
      message: verdict === 'revision_needed'
        ? `Revision is needed for your project review.`
        : `Your project has been reviewed.`,
      link: `/projects/${project._id}`
    });

    await review.populate('professor', 'name email department');
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('student', 'name email rollNumber department')
      .populate('assignedProfessor', 'name email department');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canUserAccessProject(project, req.user)) {
      return res.status(403).json({ message: 'Not authorized to view these reviews' });
    }

    const reviews = await Review.find({ project: req.params.projectId })
      .populate('professor', 'name email department')
      .sort({ reviewedAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, professorOnly, async (req, res) => {
  try {
    const reviews = await Review.find({ professor: req.user._id })
      .populate('project', 'title student status subject')
      .populate('professor', 'name')
      .sort({ reviewedAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
