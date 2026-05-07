const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const Review = require('../models/Review');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, rollNumber, department, section, semester, subjectSpecializations } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const subjects = Array.isArray(subjectSpecializations)
      ? subjectSpecializations
      : String(subjectSpecializations || '')
        .split(',')
        .map(subject => subject.trim())
        .filter(Boolean);

    const user = await User.create({
      name,
      email,
      password,
      role,
      rollNumber,
      department,
      section,
      semester,
      subjectSpecializations: role === 'professor' ? subjects : []
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      department: user.department,
      section: user.section,
      semester: user.semester,
      subjectSpecializations: user.subjectSpecializations,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      department: user.department,
      section: user.section,
      semester: user.semester,
      subjectSpecializations: user.subjectSpecializations,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

router.delete('/me', protect, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const projects = await Project.find({ student: req.user._id }).select('_id');
      const projectIds = projects.map(project => project._id);
      await Review.deleteMany({ project: { $in: projectIds } });
      await Project.deleteMany({ student: req.user._id });
      await Notification.deleteMany({ user: req.user._id });
    }

    if (req.user.role === 'professor') {
      const assignments = await Assignment.find({ professor: req.user._id }).select('_id');
      const assignmentIds = assignments.map(assignment => assignment._id);
      const projects = await Project.find({
        $or: [
          { assignedProfessor: req.user._id },
          { assignment: { $in: assignmentIds } }
        ]
      }).select('_id');
      const projectIds = projects.map(project => project._id);
      await Review.deleteMany({ $or: [{ professor: req.user._id }, { project: { $in: projectIds } }] });
      await Project.deleteMany({ _id: { $in: projectIds } });
      await Assignment.deleteMany({ professor: req.user._id });
      await Notification.deleteMany({ user: req.user._id });
    }

    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
