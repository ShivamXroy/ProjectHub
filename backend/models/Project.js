const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  subject: { type: String, trim: true, default: '' },
  techStack: [{ type: String }],
  githubLink: { type: String, default: '' },
  deployedLink: { type: String, default: '' },
  documentFile: { type: String, default: '' }, // file path
  sourceCodeFile: { type: String, default: '' },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedProfessor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  revisionHistory: [{
    description: { type: String, default: '' },
    documentFile: { type: String, default: '' },
    sourceCodeFile: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'revision_needed', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
