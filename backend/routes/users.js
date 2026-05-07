const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, professorOnly } = require('../middleware/auth');
const normalize = (value) => String(value || '').trim().toLowerCase();

// @GET /api/users/professors — Get all professors (for student to see)
router.get('/professors', protect, async (req, res) => {
  try {
    let professors = await User.find({ role: 'professor' }).select('-password');
    res.json(professors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/users/students — Professor gets all students
router.get('/students', protect, professorOnly, async (req, res) => {
  try {
    let students = await User.find({ role: 'student' }).select('-password');
    if (req.user.department) {
      students = students.filter(student => normalize(student.department) === normalize(req.user.department));
    }
    if (req.query.semester) {
      students = students.filter(student => normalize(student.semester) === normalize(req.query.semester));
    }
    if (req.query.section) {
      students = students.filter(student => normalize(student.section) === normalize(req.query.section));
    }
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
