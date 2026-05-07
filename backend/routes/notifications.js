const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const normalize = (value) => String(value || '').trim().toLowerCase();

router.get('/', protect, async (req, res) => {
  try {
    const stored = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
    let deadlineItems = [];

    if (req.user.role === 'student') {
      const now = new Date();
      const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const assignments = await Assignment.find({
        deadline: { $gte: now, $lte: soon }
      }).populate('professor', 'name');
      const visibleAssignments = assignments.filter(assignment =>
        normalize(assignment.department) === normalize(req.user.department)
        && normalize(assignment.semester) === normalize(req.user.semester)
        && (!assignment.section || normalize(assignment.section) === normalize(req.user.section))
      );
      const submitted = await Project.find({ student: req.user._id, assignment: { $in: visibleAssignments.map(a => a._id) } }).select('assignment');
      const submittedIds = new Set(submitted.map(project => project.assignment?.toString()));

      deadlineItems = visibleAssignments
        .filter(assignment => !submittedIds.has(assignment._id.toString()))
        .map(assignment => ({
          _id: `deadline-${assignment._id}`,
          type: 'deadline_near',
          title: 'Deadline near',
          message: `${assignment.title} is due ${assignment.deadline.toLocaleString('en-IN')}`,
          link: `/assignments/${assignment._id}/submit`,
          read: false,
          createdAt: assignment.deadline
        }));
    }

    res.json([...deadlineItems, ...stored].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { read: true });
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
