const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feedback: { type: String, required: true },
  rating: { type: Number, min: 1, max: 10, required: true },
  verdict: {
    type: String,
    enum: ['approved', 'revision_needed', 'rejected'],
    required: true
  },
  reviewedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
