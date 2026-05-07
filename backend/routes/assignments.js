const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, professorOnly } = require('../middleware/auth');

const normalize = (value) => String(value || '').trim().toLowerCase();

const professorHandlesSubject = (professor, subject) => {
  return (professor.subjectSpecializations || []).some(item => normalize(item) === normalize(subject));
};

const canViewAssignment = (assignment, user) => {
  if (user.role === 'professor') return assignment.professor._id.toString() === user._id.toString();
  return normalize(assignment.department) === normalize(user.department)
    && normalize(assignment.semester) === normalize(user.semester)
    && (!assignment.section || normalize(assignment.section) === normalize(user.section));
};

router.post('/', protect, professorOnly, async (req, res) => {
  try {
    const { title, description, subject, department, section, semester, deadline } = req.body;
    if (!title || !subject || !department || !semester || !deadline) {
      return res.status(400).json({ message: 'Title, subject, department, semester, and deadline are required' });
    }
    if (!professorHandlesSubject(req.user, subject)) {
      return res.status(403).json({ message: 'You can create assignments only for your assigned subjects' });
    }

    const assignment = await Assignment.create({
      title,
      description,
      subject,
      department,
      section,
      semester,
      professor: req.user._id,
      deadline
    });
    await assignment.populate('professor', 'name email department subjectSpecializations');

    const students = await User.find({ role: 'student' }).select('_id department semester section');
    const targets = students.filter(student =>
      normalize(student.department) === normalize(department)
      && normalize(student.semester) === normalize(semester)
      && (!section || normalize(student.section) === normalize(section))
    );
    if (targets.length) {
      await Notification.insertMany(targets.map(student => ({
        user: student._id,
        type: 'assignment_created',
        title: 'New assignment created',
        message: `${assignment.title} is open for ${assignment.subject}`,
        link: `/assignments/${assignment._id}/submit`
      })));
    }

    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    let assignments = await Assignment.find({})
      .populate('professor', 'name email department subjectSpecializations')
      .sort({ deadline: 1 });

    assignments = assignments.filter(assignment => {
      if (!canViewAssignment(assignment, req.user)) return false;
      if (req.user.role === 'student') {
        return normalize(assignment.department) === normalize(req.user.department)
          && normalize(assignment.semester) === normalize(req.user.semester)
          && (!assignment.section || normalize(assignment.section) === normalize(req.user.section));
      }
      return true;
    });

    const assignmentIds = assignments.map(assignment => assignment._id);
    const submissions = await Project.find({
      assignment: { $in: assignmentIds },
      student: req.user.role === 'student' ? req.user._id : { $exists: true }
    }).select('assignment student status submittedAt');

    const enriched = assignments.map(assignment => {
      const matching = submissions.filter(project => project.assignment?.toString() === assignment._id.toString());
      const ownSubmission = req.user.role === 'student'
        ? matching.find(project => project.student.toString() === req.user._id.toString())
        : null;
      return {
        ...assignment.toObject(),
        submissionCount: matching.length,
        mySubmission: ownSubmission || null
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/report', protect, professorOnly, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('professor', 'name email department');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (assignment.professor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this assignment report' });
    }

    const students = await User.find({ role: 'student' }).select('-password').sort({ rollNumber: 1, name: 1 });
    const departmentStudents = students.filter(student =>
      normalize(student.department) === normalize(assignment.department)
      && normalize(student.semester) === normalize(assignment.semester)
      && (!assignment.section || normalize(student.section) === normalize(assignment.section))
    );
    const submissions = await Project.find({ assignment: assignment._id })
      .populate('student', 'name email rollNumber department section semester')
      .populate('assignedProfessor', 'name email')
      .sort({ submittedAt: 1 });

    const rows = departmentStudents.map(student => {
      const submission = submissions.find(project => project.student?._id.toString() === student._id.toString());
      return {
        student,
        submitted: Boolean(submission),
        submission: submission || null,
        status: submission?.status || 'not_submitted',
        submittedAt: submission?.submittedAt || null,
        late: Boolean(submission && submission.submittedAt > assignment.deadline)
      };
    });

    res.json({
      assignment,
      summary: {
        totalStudents: departmentStudents.length,
        submitted: rows.filter(row => row.submitted).length,
        notSubmitted: rows.filter(row => !row.submitted).length,
        late: rows.filter(row => row.late).length
      },
      rows
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/report.csv', protect, professorOnly, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('professor', 'name email department');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (assignment.professor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to export this report' });
    }

    const students = await User.find({ role: 'student' }).select('-password').sort({ rollNumber: 1, name: 1 });
    const departmentStudents = students.filter(student =>
      normalize(student.department) === normalize(assignment.department)
      && normalize(student.semester) === normalize(assignment.semester)
      && (!assignment.section || normalize(student.section) === normalize(assignment.section))
    );
    const submissions = await Project.find({ assignment: assignment._id })
      .populate('student', 'name email rollNumber department section semester')
      .sort({ submittedAt: 1 });

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Name', 'Email', 'Roll Number', 'Department', 'Semester', 'Section', 'Submitted', 'Status', 'Submitted At', 'Late']
    ];

    departmentStudents.forEach(student => {
      const submission = submissions.find(project => project.student?._id.toString() === student._id.toString());
      rows.push([
        student.name,
        student.email,
        student.rollNumber || '',
        student.department || '',
        student.semester || '',
        student.section || '',
        submission ? 'Yes' : 'No',
        submission?.status || 'not_submitted',
        submission?.submittedAt ? submission.submittedAt.toISOString() : '',
        submission && submission.submittedAt > assignment.deadline ? 'Yes' : 'No'
      ]);
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.csv"`);
    res.send(rows.map(row => row.map(escapeCsv).join(',')).join('\n'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('professor', 'name email department subjectSpecializations');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (!canViewAssignment(assignment, req.user)) {
      return res.status(403).json({ message: 'Not authorized to view this assignment' });
    }
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
